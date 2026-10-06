# AI Image Judge — System Architecture

## 1. Architectural Overview

The **AI Image Judge** platform is designed as an end-to-end competition platform for AI image recreation challenges. It guarantees complete separation of concerns between presentation, business rules, model inference, and persistence.

```
┌────────────────────────────────────────────────────────┐
│                   Next.js Frontend                     │
│    (App Router, Tailwind CSS, TypeScript Strict)       │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / JSON / FormData
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Express Backend                      │
│     (Auth Middleware, Rate Limiting, Zod Validation)    │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               │ Internal HTTP            │ Signed URLs & SDK
               ▼                          ▼
┌──────────────────────────────┐  ┌──────────────────────┐
│       AI Scoring Engine      │  │       Supabase       │
│  (FastAPI, PyTorch, CUDA/CPU)│  │ (PostgreSQL, Storage,│
│  - DreamSim (35%)            │  │  Auth & RLS Policies)│
│  - DINOv2 (30%)              │  └──────────────────────┘
│  - OpenCLIP (15%)            │
│  - LPIPS (10%)               │
│  - Color Similarity (5%)     │
│  - Technical Quality (5%)    │
└──────────────────────────────┘
```

## 2. Directory Layout & Boundaries

- `frontend/`: Next.js with App Router, accessible responsive UI, zero privileged credentials.
- `backend/`: Node.js Express API layer. Trusted mediator managing database operations, anti-cheat checks, storage upload, and calling the AI service.
- `ai-service/`: Python 3.10+ FastAPI inference engine running PyTorch foundation models. Never directly exposed to public client traffic.
- `supabase/`: Canonical PostgreSQL database schema migrations, Row Level Security policies, and seeds.
- `scripts/`: System verification, migration runners, and dataset calibration export utilities.
- `docs/`: System documentation, scoring specifications, and security policies.

## 3. Data Flow Lifecycle

1. **Competition Creation**: An organizer submits a competition title, dates, rules, aspect ratio, and uploads a benchmark reference image. The backend validates the payload, stores the image in a private storage bucket (`reference-images`), and creates the database record.
2. **Contestant Participation**: A participant joins the competition and downloads/views the reference image via an authorized, short-lived signed URL.
3. **Recreation Submission**: Contestants generate AI images and submit their recreation attempt. The backend validates deadlines, participant status, attempts remaining, image magic bytes, and SHA-256 fingerprints.
4. **Automated AI Scoring**: The backend forwards reference and recreation image buffers to the AI service. The AI service computes the 6-metric ensemble, clamps scores to $[0.00, 100.00]$, detects exact byte-level matches, and returns an explainable breakdown.
5. **Persistence & Leaderboard**: The composite **Reference Similarity Score** and individual metrics are committed to PostgreSQL. The leaderboard displays ranked contestants using deterministic tie-breaking rules.
