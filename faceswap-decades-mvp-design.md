# Erafy — MVP Design Doc

## Concept

Upload a selfie → AI generates you across historical eras → get a shareable video carousel.

The core viral mechanic: a looping video showing **you** morphing through time — from caveman to modern day — that's ready to post on Instagram Reels, TikTok, or X. The carousel auto-cycles every ~4 seconds with smooth cross-fade transitions between eras.

---

## MVP Scope (Keep It Stupid Simple)

### What it does

1. User uploads **one selfie**
2. User picks a **catalog** (e.g. "Through the Ages")
3. App generates **6–8 images** of the user in different eras
4. App displays an **auto-spinning carousel** (cross-fades every ~4 sec, loops)
5. App renders a **shareable MP4 video** of the carousel loop
6. User downloads the video or shares it directly

### What it does NOT do (yet)

- No accounts / login
- No social feed
- No payments
- No mobile app (web-only)
- No custom era selection (fixed catalog for MVP)

---

## Architecture

```
┌─────────────┐       ┌─────────────────┐       ┌──────────────────┐
│   Frontend   │──────▶│   Backend API    │──────▶│  AI Image API    │
│  (React SPA) │◀──────│  (Node/Express)  │◀──────│  (Replicate)     │
└─────────────┘       └─────────────────┘       └──────────────────┘
                              │
                       ┌──────┴──────┐
                       │ Image Store  │
                       │ (local / S3) │
                       └─────────────┘
```

### Frontend — Single Page React App

- Upload screen → dropzone for selfie
- "Generate" button → shows progress (each era reveals as it completes)
- Results screen → auto-spinning carousel (cross-fade every ~4 sec, loops infinitely)
- Each era displays with a label overlay and smooth transition to the next
- "Download Video" button → exports the carousel as an MP4
- Tech: React + Tailwind, nothing fancy

### Backend — Thin API Layer

- `POST /generate` — receives selfie, triggers AI generation for each era
- Orchestrates parallel calls to the image API (one per era)
- Stitches results into an MP4 video carousel (using FFmpeg)
- Each era frame: ~4 sec hold + ~0.5 sec cross-fade transition
- Era label burned into each frame, subtle Erafy watermark in corner
- Returns individual images + final MP4 video (~30 sec loop)
- Tech: Node.js + Express (or Python + FastAPI — dealer's choice)

### AI Image Generation — The Core

This is the only part that really matters for MVP quality.

---

## API Recommendation: Replicate

**Why Replicate is the best fit for MVP:**

| Criteria               | Replicate                                      |
|------------------------|-------------------------------------------------|
| Face preservation      | Has InstantID + IP-Adapter models (best-in-class for keeping your face recognizable across styles) |
| Ease of use            | Simple REST API, no GPU setup, no fine-tuning needed |
| Pricing                | Pay-per-generation (~$0.01–0.05 per image) — perfect for prototype |
| Speed                  | ~5–15 sec per image depending on model          |
| No training required   | Single-image input, no need to upload 10+ photos |

**Specific model to use:**

→ [`zsxkib/pulid`](https://replicate.com/zsxkib/pulid) (PuLID — Pure and Lightning ID Customization)

- Takes ONE reference face photo + a text prompt
- Generates the person in any described scene/style/era
- Very strong identity preservation
- Fast (~8 sec per image)

**How it works per era:**

```
Input:  user_selfie.jpg
Prompt: "A portrait photograph of this person as an ancient Roman senator,
         wearing a white toga, marble columns in background,
         painted in the style of a Roman fresco, warm lighting"
Output: roman_era.jpg
```

Repeat for each era with a different prompt.

**Alternatives considered:**

| API            | Why not for MVP                                        |
|----------------|--------------------------------------------------------|
| OpenAI (DALL-E / gpt-image-1) | Weaker at preserving specific face identity from a single photo |
| Stability AI   | Good base models but face consistency requires extra work |
| Fal.ai         | Solid option (has InstantID too), slightly less model variety |
| Astria.ai      | Requires fine-tuning per user (~5 min wait), overkill for MVP |

---

## MVP Catalog: "Through the Ages"

A single fixed catalog of 8 eras for v1:

| # | Era              | Prompt Style                                    |
|---|------------------|-------------------------------------------------|
| 1 | Caveman          | Prehistoric human, animal furs, cave background |
| 2 | Ancient Egypt    | Pharaoh-style headdress, gold, desert temple    |
| 3 | Ancient Rome     | Toga, marble columns, Roman fresco style         |
| 4 | Medieval Knight  | Armor, castle, oil painting style                |
| 5 | Renaissance      | Velvet clothing, Rembrandt-style portrait        |
| 6 | Victorian Era    | Top hat / corset, sepia photograph               |
| 7 | 1970s Disco      | Afro/bell-bottoms, neon lights, film grain       |
| 8 | Modern Day       | Clean headshot, studio lighting (baseline)       |

---

## Shareable Output: MP4 Video

The final shareable asset is a **looping video** that auto-cycles through eras:

```
┌────────────────────────┐
│                        │
│     [ CAVEMAN ]        │  ← era label overlay
│                        │
│         🧔             │
│                        │
│              erafy.com │  ← subtle watermark
└────────────────────────┘
  ~~cross-fade (0.5s)~~
┌────────────────────────┐
│                        │
│   [ ANCIENT EGYPT ]    │
│                        │
│         🧔             │
│                        │
│              erafy.com │
└────────────────────────┘
  ... continues through all eras, then loops
```

**Video spec:**
- Resolution: 1080x1080 (square, works on all platforms)
- Each era: ~4 sec hold + ~0.5 sec cross-fade to next
- Total duration: ~36 sec for 8 eras (loops seamlessly)
- Format: MP4 (H.264) — plays natively on every platform
- Era label: large text overlay at top
- Watermark: small "erafy.com" in bottom-right corner
- Generated server-side using FFmpeg

**Why video over images:**
- Plays natively on Reels, TikTok, X, WhatsApp, iMessage
- Feed algorithms prioritize video over static images
- Allows smooth cross-fade transitions between eras
- Single file to share (no multi-image carousel hassle)
- Can add background music in future versions

---

## File Structure (MVP)

```
erafy/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Upload.jsx
│   │   │   ├── Progress.jsx
│   │   │   └── Carousel.jsx
│   │   └── index.css
│   └── package.json
├── backend/
│   ├── server.js
│   ├── routes/
│   │   └── generate.js
│   ├── services/
│   │   ├── replicate.js      # AI API calls
│   │   └── video.js           # FFmpeg video assembly
│   ├── prompts/
│   │   └── through-the-ages.json  # Era prompt definitions
│   └── package.json
└── README.md
```

---

## Flow Summary

```
User uploads selfie
        │
        ▼
Backend validates image (face detected? right size?)
        │
        ▼
Backend fires 8 parallel requests to Replicate
  (same face + 8 different era prompts)
        │
        ▼
Results come back (~10-15 sec total with parallelism)
        │
        ▼
Backend stitches into MP4 video via FFmpeg
  (4 sec per era, cross-fade transitions, era labels, watermark)
        │
        ▼
Frontend displays auto-spinning carousel preview + download video button
```

---

## What You Need to Get Started

1. **Replicate API key** → [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
2. **Node.js 18+** installed
3. **FFmpeg** installed (for video generation)
4. That's it.

---

## Estimated Build Time

| Component               | Effort       |
|--------------------------|-------------|
| Backend API + Replicate integration | ~2-3 hours |
| FFmpeg video generation    | ~1-2 hours  |
| Frontend UI               | ~2-3 hours  |
| Prompt tuning per era     | ~1-2 hours  |
| **Total MVP**             | **~1 day**  |
