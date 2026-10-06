# AI Image Judge — Database Specification

## 1. Relational Schema & Entities

The platform uses a normalized PostgreSQL database hosted on Supabase.

### Entity Relationship Model

- **`profiles`**: Extends `auth.users` with display names, avatars, and role tags (`participant`, `organizer`, `admin`). Automatically populated by trigger upon user signup.
- **`scoring_versions`**: Stores immutable configurations of model identifiers, metric weights, preprocessing versions, and normalization parameters.
- **`competitions`**: Organizers publish challenges with reference image storage paths, start/end dates, submission limits, aspect ratio rules, and linked scoring versions.
- **`competition_participants`**: Tracks registered contestants and participation status (`active`, `disqualified`, `withdrawn`). Unique index on `(competition_id, user_id)`.
- **`submissions`**: Contestant recreation attempts. Tracks original filenames, MIME types, image dimensions, SHA-256 digests, attempt numbers, and scoring states (`pending`, `processing`, `completed`, `failed`, `rejected`).
- **`scores`**: Stores the 6 individual component metrics (`dreamsim_score`, `dino_score`, `clip_score`, `lpips_score`, `color_score`, `quality_score`), composite `final_score`, inference duration in milliseconds, hardware device, and raw JSON metrics.
- **`audit_logs`**: Tracks sensitive administrative actions and status updates.

## 2. Applying Migrations

The self-contained SQL migration script is located at `supabase/schema.sql`.

### Option A: Via Supabase Dashboard (Recommended)
1. Open the Supabase Dashboard: `https://supabase.com/dashboard/project/llexnyzdvqjgvlrvzdgr`
2. Navigate to **SQL Editor**.
3. Paste the contents of `supabase/schema.sql` and click **Run**.

### Option B: Via Automated Migration Runner
If the database password is known:
```bash
node scripts/migrate.js
```
*(Ensure `DATABASE_URL` is set in `.env`)*
