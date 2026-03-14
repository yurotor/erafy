const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const useReplicate = process.env.AI_PROVIDER === 'replicate';
const { generateEra, downloadImage } = useReplicate
  ? require('../services/replicate')
  : require('../services/fal');
const { assembleVideo } = require('../services/video');
const eras = require('../prompts/through-the-ages.json');

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, '../uploads/'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// SSE endpoint: POST /api/generate
// Streams progress events as each era completes, then sends final result
router.post('/generate', upload.single('selfie'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No selfie uploaded' });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const selfiePath = req.file.path;
  const jobId = path.basename(selfiePath);
  const outputDir = path.join(__dirname, '../output', jobId);
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    // Convert selfie to base64 data URI for Replicate
    const selfieBuffer = fs.readFileSync(selfiePath);
    const mimeType = req.file.mimetype;
    const selfieBase64 = `data:${mimeType};base64,${selfieBuffer.toString('base64')}`;

    sendEvent('status', { message: 'Starting generation for all eras...' });

    const results = new Array(eras.length);
    const imagePaths = new Array(eras.length);

    const predictionPromises = eras.map((era, i) =>
      (async () => {
        sendEvent('era_started', { index: i, id: era.id, label: era.label });

        const imageUrl = await generateEra(selfieBase64, era);

        const ext = 'jpg';
        const localPath = path.join(outputDir, `${era.id}.${ext}`);
        await downloadImage(imageUrl.toString(), localPath);

        imagePaths[i] = localPath;
        results[i] = {
          index: i,
          id: era.id,
          label: era.label,
          imageUrl: `/output/${jobId}/${era.id}.${ext}`,
        };

        sendEvent('era_complete', results[i]);
      })()
    );

    await Promise.all(predictionPromises);

    sendEvent('status', { message: 'All eras complete. Assembling video...' });

    // Assemble video
    const videoPath = path.join(outputDir, 'erafy.mp4');
    const eraLabels = eras.map((e) => e.label);
    await assembleVideo(imagePaths, eraLabels, videoPath);

    const videoUrl = `/output/${jobId}/erafy.mp4`;
    sendEvent('done', { images: results, videoUrl });

  } catch (err) {
    console.error('Generation error:', err);
    sendEvent('error', { message: err.message });
  } finally {
    // Clean up uploaded selfie
    fs.unlink(selfiePath, () => {});
    res.end();
  }
});

module.exports = router;
