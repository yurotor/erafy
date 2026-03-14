const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

const ERA_CLIP_DIR = path.join(__dirname, '../assets/audio/era-clips');

// Returns the path for a given era clip and variant (a|b)
function getEraClipPath(eraId, variant) {
  return path.join(ERA_CLIP_DIR, `${eraId}-${variant}.mp3`);
}

// True only if ALL required clips exist for the given era IDs and variant
function eraClipsAvailable(eraIds, variant) {
  return eraIds.every((id) => fs.existsSync(getEraClipPath(id, variant)));
}

// Resolve FFmpeg binary (same logic as video.js)
function resolveFfmpeg() {
  for (const bin of ['/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg', '/usr/local/opt/ffmpeg-full/bin/ffmpeg', 'ffmpeg']) {
    try { execSync(`${bin} -version`, { stdio: 'ignore' }); return bin; } catch {}
  }
  return 'ffmpeg';
}
const FFMPEG_BIN = resolveFfmpeg();

// Concatenates per-era clips into a single audio file at outputPath.
// Each clip is trimmed to holdDuration seconds; a short crossfade smooths transitions.
function assembleAudioTrack(eraIds, variant, holdDuration, outputPath) {
  const clips = eraIds.map((id) => getEraClipPath(id, variant));
  const n = clips.length;
  const XFADE = 0.25; // seconds of crossfade between clips

  const inputArgs = clips.flatMap((c) => ['-i', c]);

  // Trim each clip to holdDuration, chain acrossfade between adjacent pairs
  const filterParts = clips.map((_, i) =>
    `[${i}:a]atrim=0:${holdDuration},asetpts=PTS-STARTPTS[t${i}]`
  );

  // Chain acrossfade: [t0][t1]->cf1, [cf1][t2]->cf2, ...
  let prev = 't0';
  for (let i = 1; i < n; i++) {
    const out = i === n - 1 ? 'audio_out' : `cf${i}`;
    filterParts.push(`[${prev}][t${i}]acrossfade=d=${XFADE}[${out}]`);
    prev = out;
  }

  const args = [
    ...inputArgs,
    '-filter_complex', filterParts.join(';'),
    '-map', '[audio_out]',
    '-c:a', 'aac', '-b:a', '128k',
    '-y', outputPath,
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_BIN, args);
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve(outputPath);
      else reject(new Error(`Audio assembly failed (code ${code}): ${stderr.slice(-1000)}`));
    });
    proc.on('error', (err) => reject(new Error(`Failed to spawn ffmpeg: ${err.message}`)));
  });
}

module.exports = { getEraClipPath, eraClipsAvailable, assembleAudioTrack };
