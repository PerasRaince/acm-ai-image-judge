# AI Image Judge — Security Specification

## 1. Credential Management & Boundary Governance

1. **Service Role / Secret Keys**:
   - `SUPABASE_SECRET_KEY` is restricted exclusively to the backend Node.js trusted application environment.
   - Never exposed to Next.js public client bundles (`NEXT_PUBLIC_*`).
   - Never printed in log output, error pages, or response payloads.
   - All `.env` files containing live credentials are explicitly listed in `.gitignore`.
2. **Client-Safe Credentials**:
   - Frontend accesses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 2. Row Level Security (RLS)

- Row Level Security is enabled across all tables (`profiles`, `competitions`, `competition_participants`, `submissions`, `scores`, `audit_logs`).
- Public users cannot insert scores or tamper with historical records.
- Scores can only be created by the service role executing the validated AI scoring pipeline.
- Contestants cannot access other participants' submissions before a competition concludes.

## 3. Storage Protection

- Supabase Storage buckets (`reference-images`, `submissions`, `avatars`) are configured as private.
- Files are accessed only via short-lived signed URLs generated on-demand by authorized backend endpoints.
- Path traversal protection prevents unauthorized file overwriting or deletion.

## 4. Input & Upload Validation

- File magic bytes verification (verifying `\xFF\xD8\xFF` for JPEG, `\x89PNG` for PNG, `RIFF...WEBP` for WebP).
- Maximum upload size capped at 25 MB.
- Decompression bomb mitigation: `PIL.Image.MAX_IMAGE_PIXELS = 40_000_000`.
- Rate limiting on API routes and stricter per-minute thresholds on submission and scoring endpoints.
- Helmet security headers and strict CORS origin whitelisting.
