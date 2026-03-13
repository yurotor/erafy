# Erafy — Claude Code Context

## Project
Web app: user uploads selfie → AI generates portrait across 8 historical eras → shareable MP4 video.

## Stack
- **Frontend**: React (Vite) + Tailwind CSS — `/frontend/`
- **Backend**: Node.js + Express — `/backend/`
- **AI**: Replicate API → `zsxkib/pulid` model (face-preserving image gen)
- **Video**: FFmpeg (server-side, spawned via child_process)
- **Storage**: local `uploads/` dir for MVP (swap for S3 later)

## Key constraints
- No auth, no payments, no accounts in MVP
- Single fixed catalog: "Through the Ages" (8 eras, defined in `backend/prompts/through-the-ages.json`)
- All 8 era images generated in parallel (Promise.all)
- Video: 1080×1080 MP4, 4 sec/era + 0.5 sec cross-fade, burned era labels + "erafy.com" watermark

## Environment
- Copy `.env.example` → `.env` and fill `REPLICATE_API_TOKEN`
- Node 18+, FFmpeg must be installed (`brew install ffmpeg`)
- `npm run dev` in both `/frontend` and `/backend` to run locally

## Coding conventions
- Backend: CommonJS (`require`/`module.exports`), async/await throughout
- Frontend: functional components, hooks only, no class components
- No TypeScript for MVP — plain JS
- Tailwind for all styling — no CSS modules or styled-components
- Keep components small; split at ~100 lines
