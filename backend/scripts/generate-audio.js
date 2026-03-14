#!/usr/bin/env node
// Pre-generates era audio clips via MusicGen (Replicate).
// Run once: npm run generate-audio
// Re-run to regenerate: npm run generate-audio -- --force
// Specific variant: npm run generate-audio -- --variant b
//
// Saves clips to backend/assets/audio/era-clips/<era-id>-<variant>.mp3

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Replicate = require('replicate');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../assets/audio/era-clips');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const ONLY_VARIANT = (() => {
  const i = args.indexOf('--variant');
  return i !== -1 ? args[i + 1] : null;
})();

const ERA_PROMPTS = {
  'prehistoric': {
    a: 'tribal hip-hop instrumental, bone percussion, primitive skin drums, deep bass rumble, cave reverb, 85 bpm, no vocals, loopable',
    b: 'dark hip-hop instrumental, heavy 808 bass, tribal drumming pattern, prehistoric cave atmosphere, 90 bpm, no vocals',
  },
  'ancient-egypt': {
    a: 'ancient Egyptian hip-hop instrumental, oud string plucks, sistrum shakers, frame drum groove, desert atmosphere, 85 bpm, no vocals, loopable',
    b: 'lo-fi hip-hop instrumental, ancient Egyptian pentatonic melody, dusty vinyl texture, hypnotic drum pattern, 88 bpm, no vocals',
  },
  'ancient-rome': {
    a: 'Roman hip-hop instrumental, aulos flute melody, tympanum drum groove, lyre plucks, marble hall reverb, 85 bpm, no vocals, loopable',
    b: 'epic cinematic hip-hop instrumental, Roman brass stabs, powerful percussion, triumphant atmosphere, 90 bpm, no vocals',
  },
  'medieval-knight': {
    a: 'medieval hip-hop instrumental, lute chops, tabor drum groove, horn stabs, stone castle reverb, 85 bpm, no vocals, loopable',
    b: 'dark medieval trap instrumental, minor key lute sample, 808 bass drops, gothic atmosphere, 90 bpm, no vocals',
  },
  'renaissance': {
    a: 'Renaissance hip-hop instrumental, harpsichord chops, viola da gamba bass line, baroque groove, chamber reverb, 85 bpm, no vocals, loopable',
    b: 'baroque boom bap instrumental, harpsichord sample flip, crisp dusty drums, ornate melodic runs, 88 bpm, no vocals',
  },
  'victorian-era': {
    a: 'Victorian hip-hop instrumental, upright piano chops, brass stabs, jazzy snare, parlour atmosphere, 85 bpm, no vocals, loopable',
    b: 'lo-fi jazz hop instrumental, vintage upright piano, vinyl crackle, swing hip-hop drums, 88 bpm, no vocals',
  },
  '1970s-disco': {
    a: 'disco funk hip-hop instrumental, wah rhythm guitar, slap bass, four-on-the-floor kick, hi-hat groove, 95 bpm, no vocals, loopable',
    b: 'funky 70s hip-hop instrumental, disco strings, bass guitar riff, analog drum machine, 92 bpm, no vocals',
  },
  'modern-day': {
    a: 'modern hip-hop instrumental, melodic synth lead, punchy 808 bass, trap hi-hats, clean production, 95 bpm, no vocals, loopable',
    b: 'contemporary trap instrumental, atmospheric synth pad, rolling hi-hats, deep 808 bass, crisp mix, 93 bpm, no vocals',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Collect an async-iterable of Uint8Array chunks into a Buffer and write to disk
async function saveStream(asyncIterable, dest) {
  const chunks = [];
  for await (const chunk of asyncIterable) {
    chunks.push(Buffer.from(chunk));
  }
  fs.writeFileSync(dest, Buffer.concat(chunks));
}

// Resolve the latest version ID for meta/musicgen from the Replicate API
async function resolveModelVersion(token) {
  const res = await fetch('https://api.replicate.com/v1/models/meta/musicgen/versions', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Could not fetch musicgen versions: ${res.status} ${JSON.stringify(body)}`);
  }
  const { results } = await res.json();
  if (!results?.length) throw new Error('No versions found for meta/musicgen');
  return results[0].id; // latest first
}

// Run with retry on 429 — respects retry_after from error message
async function runWithRetry(replicate, model, input, maxRetries = 5) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await replicate.run(model, { input });
    } catch (err) {
      const msg = err.message || '';
      const is429 = msg.includes('429') || msg.includes('throttled') || msg.includes('rate limit');
      if (!is429 || attempt === maxRetries) throw err;

      // Parse retry_after from error message (e.g. "retry_after":9)
      const match = msg.match(/"retry_after"\s*:\s*(\d+)/);
      const wait = match ? (parseInt(match[1], 10) + 2) * 1000 : 15000;
      console.log(`    rate limited — waiting ${Math.round(wait / 1000)}s (attempt ${attempt + 1}/${maxRetries})...`);
      await sleep(wait);
    }
  }
}

async function generateClip(replicate, modelWithVersion, eraId, variant, prompt) {
  const dest = path.join(OUTPUT_DIR, `${eraId}-${variant}.mp3`);

  if (!FORCE && fs.existsSync(dest)) {
    console.log(`  skip  ${eraId}-${variant} (exists)`);
    return;
  }

  console.log(`  gen   ${eraId}-${variant} ...`);

  const output = await runWithRetry(replicate, modelWithVersion, {
    prompt,
    duration: 5,
    model_version: 'stereo-large',
    output_format: 'mp3',
    normalization_strategy: 'loudness',
  });

  await saveStream(output, dest);
  console.log(`  saved ${path.basename(dest)}`);

  // Small polite delay between successful requests
  await sleep(2000);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
(async () => {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    console.error('Error: REPLICATE_API_TOKEN not set in backend/.env');
    process.exit(1);
  }

  console.log('Resolving latest meta/musicgen version...');
  let modelVersion;
  try {
    modelVersion = await resolveModelVersion(token);
    console.log(`Using meta/musicgen:${modelVersion.slice(0, 12)}...\n`);
  } catch (err) {
    console.error(`Failed to resolve model version: ${err.message}`);
    process.exit(1);
  }

  const replicate = new Replicate({ auth: token });
  const modelWithVersion = `meta/musicgen:${modelVersion}`;
  const variants = ONLY_VARIANT ? [ONLY_VARIANT] : ['a', 'b'];
  const eraIds = Object.keys(ERA_PROMPTS);

  console.log(`Generating ${eraIds.length * variants.length} clips (variant(s): ${variants.join(', ')})...\n`);

  for (const eraId of eraIds) {
    for (const variant of variants) {
      const prompt = ERA_PROMPTS[eraId]?.[variant];
      if (!prompt) { console.warn(`  warn  no prompt for ${eraId}-${variant}`); continue; }
      try {
        await generateClip(replicate, modelWithVersion, eraId, variant, prompt);
      } catch (err) {
        console.error(`  error ${eraId}-${variant}: ${err.message}`);
      }
    }
  }

  console.log('\nDone. Clips saved to backend/assets/audio/era-clips/');
})();
