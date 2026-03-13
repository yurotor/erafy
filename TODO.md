# Erafy MVP — TODO

## Phase 1: Backend Foundation
- [ ] Init Node/Express project (`backend/`)
- [ ] POST /generate route — accept multipart selfie upload
- [ ] Input validation: face detection check (sharp or basic size check)
- [ ] Replicate service (`services/replicate.js`) — call zsxkib/pulid model
- [ ] Era prompts file (`prompts/through-the-ages.json`) — all 8 eras
- [ ] Parallel generation — Promise.all for all 8 era calls
- [ ] Download and save generated images locally
- [ ] SSE or polling endpoint so frontend can show per-era progress

## Phase 2: Video Assembly
- [ ] FFmpeg service (`services/video.js`)
- [ ] Cross-fade filter graph (xfade, 4 sec hold + 0.5 sec transition)
- [ ] Era label overlay (drawtext filter)
- [ ] Watermark overlay ("erafy.com" bottom-right)
- [ ] 1080×1080 output, H.264, MP4
- [ ] Return video URL to frontend

## Phase 3: Frontend
- [ ] Vite + React scaffold (`frontend/`)
- [ ] Tailwind setup
- [ ] Upload screen — drag-and-drop dropzone (react-dropzone)
- [ ] Progress screen — era cards reveal as each image completes
- [ ] Carousel screen — auto-cross-fade every 4 sec, looping, era label overlay
- [ ] Download Video button — links to backend-generated MP4
- [ ] Basic error states (upload failed, generation failed)
- [ ] Mobile-responsive layout

## Phase 4: Integration & Polish
- [ ] CORS config on backend
- [ ] .env.example file
- [ ] End-to-end test with a real selfie + Replicate API key
- [ ] Prompt tuning — iterate on quality per era
- [ ] README with setup instructions

## Stretch (post-MVP)
- [ ] S3 storage for uploads and generated images
- [ ] Job queue for concurrent users (BullMQ)
- [ ] Background music on video
- [ ] Multiple catalogs (e.g., "Through the Decades", "Fantasy Worlds")
