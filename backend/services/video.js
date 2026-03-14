const { spawn, execSync } = require('child_process');
const fs = require('fs');

const HOLD_DURATION = 4;   // seconds each era is shown
const FADE_DURATION = 0.5; // seconds for fade in/out per segment

function resolveFfmpeg() {
  const candidates = [
    '/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg',
    '/usr/local/opt/ffmpeg-full/bin/ffmpeg',
    'ffmpeg',
  ];
  for (const bin of candidates) {
    try {
      execSync(`${bin} -version`, { stdio: 'ignore' });
      return bin;
    } catch {
      // not found
    }
  }
  return 'ffmpeg';
}

const FFMPEG_BIN = resolveFfmpeg();

// Check for drawtext support (optional — video works without it)
let HAS_DRAWTEXT = false;
try {
  execSync(`${FFMPEG_BIN} -filters 2>&1 | grep drawtext`, { stdio: 'pipe' });
  HAS_DRAWTEXT = true;
} catch {
  // drawtext not available
}

const FONT_BOLD = fs.existsSync('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
  ? 'fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:'
  : '';
const FONT_REGULAR = fs.existsSync('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
  ? 'fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:'
  : '';

function buildFFmpegArgs(imagePaths, eraLabels, outputPath, audioPath = null) {
  const n = imagePaths.length;

  // Each image is looped for HOLD_DURATION seconds
  const inputArgs = [];
  imagePaths.forEach((p) => {
    inputArgs.push('-loop', '1', '-t', String(HOLD_DURATION), '-i', p);
  });

  // Audio is the last input (index n)
  if (audioPath) {
    inputArgs.push('-i', audioPath);
  }

  const filterParts = [];

  // Scale each input + add fade in/out + format
  for (let i = 0; i < n; i++) {
    const fadeOut = HOLD_DURATION - FADE_DURATION;
    let chain = `[${i}:v]scale=512:512,setsar=1,format=yuv420p`;
    chain += `,fade=t=in:st=0:d=${FADE_DURATION}`;
    chain += `,fade=t=out:st=${fadeOut}:d=${FADE_DURATION}`;

    // Add era label if drawtext is available
    if (HAS_DRAWTEXT) {
      const label = eraLabels[i].toUpperCase().replace(/'/g, "\u2019").replace(/:/g, '\\:');
      chain += `,drawtext=${FONT_BOLD}text='${label}':fontsize=44:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=40`;
    }

    chain += `[s${i}]`;
    filterParts.push(chain);
  }

  // Concat all segments
  const concatInputs = Array.from({ length: n }, (_, i) => `[s${i}]`).join('');
  let concatChain = `${concatInputs}concat=n=${n}:v=1:a=0`;

  // Add watermark if drawtext available
  if (HAS_DRAWTEXT) {
    concatChain += `[merged];[merged]drawtext=${FONT_REGULAR}text='erafy.com':fontsize=20:fontcolor=white@0.6:borderw=1:bordercolor=black@0.4:x=w-text_w-14:y=h-text_h-14[out]`;
  } else {
    concatChain += '[out]';
  }

  filterParts.push(concatChain);

  // --- Audio ---
  // Trim soundtrack to video length, fade out last 2 seconds.
  if (audioPath) {
    const totalDuration = n * HOLD_DURATION;
    const fadeStart = totalDuration - 2;
    filterParts.push(
      `[${n}:a]atrim=0:${totalDuration},asetpts=PTS-STARTPTS,afade=t=out:st=${fadeStart}:d=2[audio_out]`
    );
  }

  const args = [
    ...inputArgs,
    '-filter_complex', filterParts.join(';'),
    '-map', '[out]',
  ];

  if (audioPath) {
    args.push('-map', '[audio_out]', '-c:a', 'aac', '-b:a', '128k');
  }

  args.push(
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '26',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-shortest',
    '-y',
    outputPath,
  );

  return args;
}

function assembleVideo(imagePaths, eraLabels, outputPath, audioPath = null) {
  return new Promise((resolve, reject) => {
    const args = buildFFmpegArgs(imagePaths, eraLabels, outputPath, audioPath);
    const proc = spawn(FFMPEG_BIN, args);

    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        console.error('FFmpeg stderr:', stderr.slice(-2000));
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn ffmpeg: ${err.message}`));
    });
  });
}

module.exports = { assembleVideo };
