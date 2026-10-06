# AI Image Judge Platform

Production-ready, end-to-end web platform for AI image recreation competitions. Organizers supply a benchmark reference image, participants submit AI-generated recreations, and a multi-metric vision ensemble evaluates perceptual, structural, and semantic correspondence to produce an explainable **Reference Similarity Score (0–100)** and live leaderboard.

---

## Key Highlights

- **6-Metric Explainable AI Scoring Ensemble**:
  - **DreamSim (35%)**: Deep human-perceptual similarity distance
  - **DINOv2 (30%)**: Self-supervised structural and visual correspondence
  - **OpenCLIP (15%)**: Semantic and conceptual image-to-image similarity
  - **LPIPS (10%)**: Learned patch-level texture and detail distance
  - **Color Distribution (5%)**: CIE L\*a\*b\* centroids & 3D HSV histogram correlation
  - **Technical Quality (5%)**: Laplacian sharpness and dynamic range integrity
- **Architectural Separation**: Clean isolation between `frontend/` (Next.js/TS), `backend/` (Express/TS), `ai-service/` (FastAPI/PyTorch), and `supabase/` (PostgreSQL/Storage/Auth).
- **Anti-Cheat & Fairness**:
  - Immediate SHA-256 fingerprint matching rejects exact reference re-uploads.
  - Per-participant attempt limits and deadline enforcement.
  - Frozen, versioned scoring configs prevent algorithmic drift.
  - Deterministic tie-breaking rules on leaderboards.
- **Security & Privacy**:
  - Zero privileged keys exposed to browser bundles.
  - Private Supabase Storage buckets with short-lived signed URLs.
  - Granular PostgreSQL Row Level Security (RLS) policies.

---

## Repository Architecture

```text
ai-image-judge/
├── frontend/             # Next.js 16 App Router, TypeScript, Tailwind CSS
├── backend/              # Node.js, Express, TypeScript, Zod, Supabase SDK
├── ai-service/           # Python 3.10+, FastAPI, PyTorch, DreamSim, DINOv2, CLIP, LPIPS
├── supabase/             # PostgreSQL schema migrations, RLS policies, seeds
│   ├── migrations/       # Normalized table definitions
│   ├── policies/         # Strict Row Level Security policies
│   ├── seed/             # Default scoring version seeds
│   └── schema.sql        # Self-contained executable setup script
├── scripts/              # E2E verification, migration runner, calibration exporter
└── docs/                 # Architecture, Scoring, Security, Database specifications
```

---

## Quick Start & Verification

### 1. Database Setup
Copy and run `supabase/schema.sql` in the [Supabase SQL Editor](https://supabase.com/dashboard/project/llexnyzdvqjgvlrvzdgr).

### 2. Verify AI Scoring Ensemble (All 14 tests)
```powershell
cd ai-service
python -m pytest tests/ -v
```

### 3. Verify Backend API (All 9 tests)
```powershell
cd backend
npm test
```

### 4. Run Full End-to-End Pipeline
```powershell
python scripts/verify_e2e.py
```

### 5. Start Development Servers
- **AI Service**: `cd ai-service && python -m uvicorn app.main:app --port 8000`
- **Backend API**: `cd backend && npm run dev`
- **Frontend App**: `cd frontend && npm run dev`
