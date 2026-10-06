-- 00001_initial_schema.sql
-- AI Image Judge Platform - Initial Database Schema Migration
-- User-driven competition platform with Google Meet style code-based joining flow.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE
-- Extends Supabase auth.users with public profile information
-- Every authenticated user can host competitions and participate in them.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Automatic profile creation on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing auth users into profiles
INSERT INTO public.profiles (id, display_name, avatar_url, role)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1), 'User'),
    raw_user_meta_data->>'avatar_url',
    COALESCE(raw_user_meta_data->>'role', 'user')
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 2. SCORING VERSIONS TABLE
-- Stores immutable configurations of model weights, versions, and calibrations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scoring_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    version TEXT UNIQUE NOT NULL,
    model_versions JSONB NOT NULL DEFAULT '{}'::jsonb,
    preprocessing_version TEXT NOT NULL DEFAULT 'v1',
    metric_weights JSONB NOT NULL,
    normalization_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_scoring_versions_version ON public.scoring_versions(version);
CREATE INDEX IF NOT EXISTS idx_scoring_versions_active ON public.scoring_versions(is_active);

-- ============================================================================
-- 3. COMPETITIONS TABLE
-- Competitions hosted by any authenticated user with unique Google Meet style code
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL CHECK (char_length(trim(code)) >= 6),
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL CHECK (char_length(trim(title)) >= 3),
    description TEXT,
    rules TEXT,
    reference_image_path TEXT NOT NULL,
    reference_width INTEGER,
    reference_height INTEGER,
    reference_sha256 TEXT,
    required_aspect_ratio TEXT NOT NULL DEFAULT 'any' CHECK (required_aspect_ratio IN ('any', '1:1', '16:9', '4:3', '9:16', '3:4')),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    submission_limit INTEGER NOT NULL DEFAULT 3 CHECK (submission_limit >= 1 AND submission_limit <= 50),
    leaderboard_visibility TEXT NOT NULL DEFAULT 'public' CHECK (leaderboard_visibility IN ('public', 'hidden_until_close', 'participants_only')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'scheduled', 'active', 'scoring', 'completed', 'cancelled')),
    scoring_version_id UUID REFERENCES public.scoring_versions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_competition_dates CHECK (ends_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_competitions_code_lower ON public.competitions(lower(code));
CREATE INDEX IF NOT EXISTS idx_competitions_host ON public.competitions(host_id);
CREATE INDEX IF NOT EXISTS idx_competitions_status ON public.competitions(status);
CREATE INDEX IF NOT EXISTS idx_competitions_dates ON public.competitions(starts_at, ends_at);

DROP TRIGGER IF EXISTS set_competitions_updated_at ON public.competitions;
CREATE TRIGGER set_competitions_updated_at
    BEFORE UPDATE ON public.competitions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 4. COMPETITION PARTICIPANTS TABLE
-- Tracks contestants who joined via code or invitation link
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.competition_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disqualified', 'withdrawn')),
    UNIQUE(competition_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comp_participants_user ON public.competition_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_comp_participants_comp ON public.competition_participants(competition_id);

-- ============================================================================
-- 5. SUBMISSIONS TABLE
-- Participant AI-generated image recreation attempts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL CHECK (mime_type IN ('image/png', 'image/jpeg', 'image/webp')),
    width INTEGER NOT NULL CHECK (width > 0),
    height INTEGER NOT NULL CHECK (height > 0),
    sha256 TEXT NOT NULL,
    perceptual_hash TEXT,
    attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    scoring_status TEXT NOT NULL DEFAULT 'pending' CHECK (scoring_status IN ('pending', 'processing', 'completed', 'failed', 'rejected')),
    rejection_reason TEXT,
    UNIQUE(competition_id, participant_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_submissions_comp ON public.submissions(competition_id);
CREATE INDEX IF NOT EXISTS idx_submissions_participant ON public.submissions(participant_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(scoring_status);
CREATE INDEX IF NOT EXISTS idx_submissions_sha256 ON public.submissions(competition_id, sha256);

-- ============================================================================
-- 6. SCORES TABLE
-- Granular explainable similarity metrics and composite Reference Similarity Score
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL UNIQUE REFERENCES public.submissions(id) ON DELETE CASCADE,
    scoring_version_id UUID NOT NULL REFERENCES public.scoring_versions(id),
    dreamsim_score NUMERIC(5,2) NOT NULL CHECK (dreamsim_score >= 0.00 AND dreamsim_score <= 100.00),
    dino_score NUMERIC(5,2) NOT NULL CHECK (dino_score >= 0.00 AND dino_score <= 100.00),
    clip_score NUMERIC(5,2) NOT NULL CHECK (clip_score >= 0.00 AND clip_score <= 100.00),
    lpips_score NUMERIC(5,2) NOT NULL CHECK (lpips_score >= 0.00 AND lpips_score <= 100.00),
    color_score NUMERIC(5,2) NOT NULL CHECK (color_score >= 0.00 AND color_score <= 100.00),
    quality_score NUMERIC(5,2) NOT NULL CHECK (quality_score >= 0.00 AND quality_score <= 100.00),
    final_score NUMERIC(5,2) NOT NULL CHECK (final_score >= 0.00 AND final_score <= 100.00),
    raw_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    inference_duration_ms INTEGER NOT NULL CHECK (inference_duration_ms >= 0),
    device TEXT NOT NULL,
    model_metadata JSONB DEFAULT '{}'::jsonb,
    scored_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_scores_submission ON public.scores(submission_id);
CREATE INDEX IF NOT EXISTS idx_scores_final ON public.scores(final_score DESC);

-- ============================================================================
-- 7. AUDIT LOGS TABLE
-- Records sensitive events like status updates or administrative actions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
