const { spawn, execSync } = require('child_process');
const path = require('path');

const HOLD_DURATION = 4;    // seconds each era is shown
const FADE_DURATION = 0.5;  // seconds for cross-fade transition

// Prefer ffmpeg-full (has drawtext/libfreetype) over the stripped default build
function resolveFfmpeg() {
  const candidates = [
    '/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg',
    '/usr/local/opt/ffmpeg-full/bin/ffmpeg',
    'ffmpeg',
  ];
  for (const bin of candidates) {
    try {
      execSync(`${bin} -filters 2>/dev/null | grep -q drawtext`, { stdio: 'ignore' });
      return bin;
    } catch {
      // not found or doesn't have drawtext
    }
  }
  return 'ffmpeg'; // fallback; will fail if drawtext missing
}

const FFMPEG_BIN = resolveFfmpeg();

/**
 * Builds the FFmpeg filter_complex string for xfade transitions + text overlays.
 * @param {string[]} imagePaths - ordered list of input image file paths
 * @param {string[]} eraLabels  - matching era display labels
 * @returns {{ args: string[], filterComplex: string }}
 */
function buildFFmpegArgs(imagePaths, eraLabels, outputPath) {
  const n = imagePaths.length;
  const segmentDuration = HOLD_DURATION + FADE_DURATION; // 4.5 sec per segment

  // -loop 1 -t <duration> -i <image> for each input
  const inputArgs = [];
  imagePaths.forEach((p) => {
    inputArgs.push('-loop', '1', '-t', String(segmentDuration), '-i', p);
  });

  // Build xfade chain
  // Each transition offset = i * HOLD_DURATION (not segmentDuration — they overlap)
  let filterParts = [];

  // Scale all inputs to 1080x1080 with proper pixel format
  for (let i = 0; i < n; i++) {
    filterParts.push(`[${i}:v]scale=720:720:force_original_aspect_ratio=decrease,pad=720:720:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p[v${i}]`);
  }

  // Chain xfade transitions
  // xfade offset = i * HOLD_DURATION (when the next fade starts)
  let lastLabel = 'v0';
  for (let i = 1; i < n; i++) {
    const offset = i * HOLD_DURATION;
    const outLabel = i === n - 1 ? 'xfaded' : `xf${i}`;
    filterParts.push(
      `[${lastLabel}][v${i}]xfade=transition=fade:duration=${FADE_DURATION}:offset=${offset}[${outLabel}]`
    );
    lastLabel = outLabel;
  }

  // Add era label drawtext filters (chain on the xfaded output)
  // Each era occupies [i*HOLD_DURATION, (i+1)*HOLD_DURATION] seconds of the output
  let textChain = 'xfaded';
  for (let i = 0; i < n; i++) {
    const startTime = i * HOLD_DURATION;
    const endTime = startTime + HOLD_DURATION;
    const label = eraLabels[i].toUpperCase().replace(/'/g, "\\'").replace(/:/g, '\\:');
    const outLabel = i === n - 1 ? 'labeled' : `lbl${i}`;
    filterParts.push(
      `[${textChain}]drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${label}':fontsize=44:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=40:enable='between(t,${startTime},${endTime})'[${outLabel}]`
    );
    textChain = outLabel;
  }

  // Add watermark
  filterParts.push(
    `[${textChain}]drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='erafy.com':fontsize=20:fontcolor=white@0.6:borderw=1:bordercolor=black@0.4:x=w-text_w-14:y=h-text_h-14[out]`
  );

  const filterComplex = filterParts.join(';');

  const args = [
    ...inputArgs,
    '-filter_complex', filterComplex,
    '-map', '[out]',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '26',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-y',
    outputPath,
  ];

  return args;
}

/**
 * Assembles era images into a cross-fade MP4.
 * @param {string[]} imagePaths - ordered paths to 1080x1080 era images
 * @param {string[]} eraLabels  - display labels
 * @param {string}   outputPath - destination .mp4 path
 * @returns {Promise<string>} resolves with outputPath
 */
function assembleVideo(imagePaths, eraLabels, outputPath) {
  return new Promise((resolve, reject) => {
    const args = buildFFmpegArgs(imagePaths, eraLabels, outputPath);

    console.log('FFmpeg binary:', FFMPEG_BIN);
    console.log('FFmpeg args:', args.join(' '));

    const proc = spawn(FFMPEG_BIN, args);

    let stderr = '';
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        console.error('FFmpeg stderr:', stderr);
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn ffmpeg: ${err.message}. Make sure ffmpeg is installed.`));
    });
  });
}

module.exports = { assembleVideo };
