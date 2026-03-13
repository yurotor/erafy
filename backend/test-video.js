/**
 * Standalone test for FFmpeg video assembly.
 * Creates 8 solid-colour placeholder images and runs the full video pipeline.
 *
 * Usage:
 *   node test-video.js
 *
 * Requires: ffmpeg installed (brew install ffmpeg)
 * Output:  backend/output/test/erafy-test.mp4
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { assembleVideo } = require('./services/video');

// Use the same ffmpeg binary resolution as video.js
const FFMPEG = (() => {
  const candidates = ['/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg', '/usr/local/opt/ffmpeg-full/bin/ffmpeg', 'ffmpeg'];
  for (const b of candidates) {
    try { require('child_process').execSync(`${b} -version`, { stdio: 'ignore' }); return b; } catch {}
  }
  return 'ffmpeg';
})();

const ERA_LABELS = [
  'Caveman', 'Ancient Egypt', 'Ancient Rome', 'Medieval Knight',
  'Renaissance', 'Victorian Era', '1970s Disco', 'Modern Day',
];

const COLOURS = [
  'sienna', 'gold', 'maroon', 'silver',
  'navy', 'peru', 'deeppink', 'steelblue',
];

const OUTDIR = path.join(__dirname, 'output', 'test');
fs.mkdirSync(OUTDIR, { recursive: true });

async function makeColourImage(colour, destPath) {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG, [
      '-f', 'lavfi',
      '-i', `color=c=${colour}:size=1080x1080:duration=1`,
      '-vframes', '1',
      '-y', destPath,
    ]);
    proc.on('close', (code) => code === 0 ? resolve(destPath) : reject(new Error(`ffmpeg colour gen failed: ${code}`)));
    proc.on('error', reject);
  });
}

async function run() {
  console.log('Generating placeholder images…');
  const imagePaths = await Promise.all(
    COLOURS.map((c, i) => makeColourImage(c, path.join(OUTDIR, `era-${i}.jpg`)))
  );

  console.log('Assembling video…');
  const videoPath = path.join(OUTDIR, 'erafy-test.mp4');
  await assembleVideo(imagePaths, ERA_LABELS, videoPath);
  console.log('Done!', videoPath);
}

run().catch((err) => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
