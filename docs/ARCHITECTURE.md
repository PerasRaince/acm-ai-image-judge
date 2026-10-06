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

1. **Competition Creation**: Any authenticated user can host a competition by submitting a title, dates, rules, aspect ratio, and target reference image. The backend generates a unique, non-sequential Google Meet style competition code (e.g. `k9m-p4x-2wq`) and stores the image in a private storage bucket (`reference-images`). The creator automatically becomes the host (`host_id`).
2. **Invitation & Joining Flow**: The host shares the unique code or invitation link (`/join/[code]`). Any contestant can join either by entering the code in the Google Meet style join input or by opening the link. Unauthenticated visitors see a competition preview and are prompted to log in with automatic `returnUrl` preservation.
3. **Contestant Participation**: A joined contestant downloads/views the reference image via an authorized, short-lived signed URL.
4. **Recreation Submission**: Contestants submit their AI-generated recreation attempts. The backend validates deadlines, contestant membership, attempt limits, aspect ratio, and SHA-256 fingerprints. Anti-cheat immediately rejects exact duplicates of the reference image.
5. **Automated AI Scoring**: The backend downloads the reference buffer and forwards both images to the AI service. The AI service computes the 6-metric ensemble (DreamSim 35%, DINOv2 30%, OpenCLIP 15%, LPIPS 10%, Color 5%, Quality 5%), clamps scores to $[0.00, 100.00]$, and returns the explainable breakdown.
6. **Persistence & Leaderboard**: The composite **Reference Similarity Score** and individual metrics are committed to PostgreSQL. The transparent leaderboard displays ranked contestants with deterministic tie-breaking rules.
