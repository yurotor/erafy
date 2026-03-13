const Replicate = require('replicate');
const fs = require('fs');
const https = require('https');
const http = require('http');

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// Latest version hash — run: curl https://api.replicate.com/v1/models/zsxkib/pulid/versions
const PULID_VERSION = '43d309c37ab4e62361e5e29b8e9e867fb2dcbcec77ae91206a8d95ac5dd451a0';

async function withRetry(fn, retries = 4, delayMs = 10000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = err.message && (err.message.includes('429') || err.message.toLowerCase().includes('throttled') || err.message.toLowerCase().includes('rate limit'));
      if (isRateLimit && attempt < retries) {
        console.log(`Rate limited — retrying in ${delayMs / 1000}s (attempt ${attempt + 1}/${retries})`);
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        throw err;
      }
    }
  }
}

const NEGATIVE_PROMPT =
  'shiny skin, oily skin, glossy skin, plastic skin, waxy skin, doll skin, ' +
  'forehead wrinkles, brow furrows, forehead lines, deep creases, ' +
  'cartoonish, anime, cgi, illustration, painting artifacts, airbrushed, over-smoothed, ' +
  'blurry face, soft focus, distorted face, asymmetric eyes, generic nose, button nose, ' +
  'deformed features, mutated, ugly, unrealistic, fake eyes, glass eyes, lifeless eyes';

async function generateEra(selfieBase64, era) {
  const output = await withRetry(() => replicate.run(`zsxkib/pulid:${PULID_VERSION}`, {
    input: {
      main_face_image: selfieBase64,
      prompt: era.prompt,
      negative_prompt: NEGATIVE_PROMPT,
      num_samples: 1,
      image_width: 1024,
      image_height: 1024,
      num_steps: 28,
      cfg_scale: 1.5,
      identity_scale: 1.1,
      output_format: 'jpg',
      output_quality: 90,
    },
  }));

  // v1 SDK returns FileOutput objects; extract URL string
  const result = Array.isArray(output) ? output[0] : output;

  // FileOutput has a .url() method; fall back to toString for plain URLs
  if (result && typeof result.url === 'function') {
    return result.url().toString();
  }
  return result.toString();
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
      file.on('finish', () => {
        file.close();
        resolve(destPath);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

module.exports = { generateEra, downloadImage };
