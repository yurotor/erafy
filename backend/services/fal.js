const { fal } = require('@fal-ai/client');
const https = require('https');
const http = require('http');
const fs = require('fs');

fal.config({ credentials: process.env.FAL_KEY });

async function uploadSelfie(selfieBase64) {
  const [header, b64data] = selfieBase64.split(',');
  const mimeType = header.match(/data:([^;]+)/)[1];
  const buffer = Buffer.from(b64data, 'base64');
  return fal.storage.upload(new Blob([buffer], { type: mimeType }), { filename: 'selfie.jpg' });
}

async function generateEra(selfieUrl, era) {
  const result = await fal.subscribe('fal-ai/flux-pulid', {
    input: {
      reference_image_url: selfieUrl,
      prompt: era.prompt,
      num_inference_steps: 4,
      num_images: 1,
      image_size: { width: 512, height: 512 },
    },
    pollInterval: 500,
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
