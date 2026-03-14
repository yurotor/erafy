const { fal } = require('@fal-ai/client');
const https = require('https');
const http = require('http');
const fs = require('fs');

fal.config({ credentials: process.env.FAL_KEY });

const NEGATIVE_PROMPT =
  'shiny skin, oily skin, glossy skin, plastic skin, waxy skin, doll skin, ' +
  'forehead wrinkles, brow furrows, forehead lines, deep creases, ' +
  'cartoonish, anime, cgi, illustration, painting artifacts, airbrushed, over-smoothed, ' +
  'blurry face, soft focus, distorted face, asymmetric eyes, generic nose, button nose, ' +
  'deformed features, mutated, ugly, unrealistic, fake eyes, glass eyes, lifeless eyes';

async function uploadSelfie(selfieBase64) {
  const [header, b64data] = selfieBase64.split(',');
  const mimeType = header.match(/data:([^;]+)/)[1];
  const buffer = Buffer.from(b64data, 'base64');
  return fal.storage.upload(new Blob([buffer], { type: mimeType }), { filename: 'selfie.jpg' });
}

async function generateEra(selfieUrl, era) {
  const result = await fal.subscribe('fal-ai/pulid', {
    input: {
      reference_images: [{ image_url: selfieUrl }],
      prompt: era.prompt,
      negative_prompt: NEGATIVE_PROMPT,
      num_inference_steps: 4,
      guidance_scale: 1.2,
      num_images: 1,
      image_size: { width: 512, height: 512 },
    },
    pollInterval: 1000,
    logs: false,
  });

  return result.data.images[0].url;
}

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error(`Failed to download image: HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
  });
}

module.exports = { uploadSelfie, generateEra, downloadImage };
