# AI Image Judge Platform

Production-ready, user-driven web platform for AI image recreation competitions. Features a streamlined **Google Meet style joining experience**: any authenticated user can create a competition to become its host, automatically generating a unique non-sequential competition code (e.g. `k9m-p4x-2wq`) and shareable invitation URL (`/join/[code]`). Other contestants join directly with the code or link and submit their AI-generated recreations. A multi-metric vision ensemble evaluates perceptual, structural, and semantic correspondence to produce an explainable **Reference Similarity Score (0–100)** and live ranked leaderboard.

---

## Key Highlights

- **User-Driven Competition Lifecycle & Google Meet Join Flow**:
  - **No Separate Organizer Role**: Every authenticated user can host competitions and participate in other challenges.
  - **Unique Competition Codes**: Database-enforced, cryptographically generated, non-sequential codes (`xxx-xxxx-xxx`, >$8 \times 10^{14}$ permutation space) and shareable `/join/[code]` links.
  - **Google Meet Style Join Bar**: Enter a code or paste a shareable URL directly from the homepage or dashboard to join instantly.
  - **Unauthenticated Protection with `returnUrl`**: Public landing page and invitation preview are openly accessible, but any action to create, join, submit, or manage automatically redirects to authentication and returns to the target competition upon sign-in.
- **Complete Supabase Authentication**:
  - Email/password signup with interactive live password requirement validation (min 8 chars, uppercase, lowercase, number, special character).
  - Google OAuth single-click authentication.
  - Email/password login with session persistence.
  - Secure forgot-password email request (`/forgot-password`) and password update flow (`/reset-password`).
- **6-Metric Explainable AI Scoring Ensemble**:
  - **DreamSim (35%)**: Deep human-perceptual similarity distance
  - **DINOv2 (30%)**: Self-supervised structural and visual correspondence
  - **OpenCLIP (15%)**: Semantic and conceptual image-to-image similarity
  - **LPIPS (10%)**: Learned patch-level texture and detail distance
  - **Color Distribution (5%)**: CIE L\*a\*b\* centroids & 3D HSV histogram correlation
  - **Technical Quality (5%)**: Laplacian sharpness and dynamic range integrity
- **Architectural Separation**: Clean isolation between `frontend/` (Next.js 16/Turbopack/TS), `backend/` (Express/TS/Zod), `ai-service/` (FastAPI/PyTorch), and `supabase/` (PostgreSQL/Storage/Auth).
- **Anti-Cheat & Competition Integrity**:
  - Immediate SHA-256 fingerprint matching rejects exact reference re-uploads.
  - Per-participant attempt limits and deadline enforcement.
  - Frozen, versioned scoring configs prevent algorithmic drift.
  - Deterministic tie-breaking rules on leaderboards.
- **Security & Privacy**:
  - Zero privileged keys exposed in client bundles.
  - Private Supabase Storage buckets with short-lived signed URLs.
  - Granular PostgreSQL Row Level Security (RLS) policies.

---

## Repository Architecture

```text
ai-image-judge/
├── frontend/             # Next.js 16 App Router, TypeScript, Tailwind CSS
│   ├── app/
│   │   ├── competitions/ # Directory, [id] details, submit, and create
│   │   ├── dashboard/    # Host & Contestant unified dashboard
│   │   ├── join/[code]/  # Google Meet style invitation preview & resolver
│   │   ├── login/        # Auth sign-in with Google OAuth and returnUrl
│   │   ├── signup/       # Auth sign-up with live password validator
│   │   ├── forgot-password/
│   │   └── reset-password/
│   └── components/       # JoinCodeInput, PasswordRequirements, CountdownTimer, MetricBar
├── backend/              # Node.js, Express, TypeScript, Zod, Supabase SDK
│   ├── src/
│   │   ├── controllers/  # Competition, Auth, Submission, Leaderboard
│   │   ├── services/     # Competition, AI scoring, Leaderboard, Storage
│   │   └── utils/        # codeGenerator (Meet codes & normalizer)
│   └── tests/            # Jest unit tests for validators, tie-breaking, and API
├── ai-service/           # Python 3.10+, FastAPI, PyTorch, DreamSim, DINOv2, CLIP, LPIPS
│   ├── app/scoring/      # Multi-metric ensemble scoring engine
│   └── tests/            # Pytest suite covering all scorers, invariants, and API
├── supabase/             # PostgreSQL schema migrations, RLS policies, seeds
│   ├── migrations/       # Normalized table definitions with code & host_id
│   ├── policies/         # Strict Row Level Security policies
│   ├── seed/             # Default scoring version seeds
│   └── schema.sql        # Self-contained executable setup script
└── scripts/              # E2E verification, two-user flow test, calibration exporter
    ├── test_two_user_flow.py # Complete 2-user integration test
    └── verify_e2e.py     # AI scoring engine verification
```

---

## Quick Start & Verification

### 1. Database Setup
Copy and run `supabase/schema.sql` in your [Supabase SQL Editor](https://supabase.com/dashboard/project/llexnyzdvqjgvlrvzdgr).

### 2. Verify AI Scoring Ensemble (All 14 tests)
```powershell
cd ai-service
python -m pytest tests/ -v
```

### 3. Verify Backend API & Code Utilities (All 13 tests)
```powershell
cd backend
npm test
```

### 4. Build Frontend (0 errors)
```powershell
cd frontend
npm run build
```

### 5. Run Two-User Integration Workflow
```powershell
python scripts/test_two_user_flow.py
```

### 6. Start Development Servers
- **AI Service**: `cd ai-service && python -m uvicorn app.main:app --port 8000`
- **Backend API**: `cd backend && npm run dev`
- **Frontend App**: `cd frontend && npm run dev`
