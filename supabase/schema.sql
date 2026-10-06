-- schema.sql
-- AI Image Judge Platform - Self-Contained Complete Schema & Policies
-- Paste directly into Supabase Dashboard -> SQL Editor and click 'Run'.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'organizer', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'role', 'participant')
    )
    ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. SCORING VERSIONS TABLE
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
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
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
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'scoring', 'completed', 'cancelled')),
    scoring_version_id UUID REFERENCES public.scoring_versions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_competition_dates CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_competitions_organizer ON public.competitions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_competitions_status ON public.competitions(status);
CREATE INDEX IF NOT EXISTS idx_competitions_dates ON public.competitions(starts_at, ends_at);

DROP TRIGGER IF EXISTS set_competitions_updated_at ON public.competitions;
CREATE TRIGGER set_competitions_updated_at
    BEFORE UPDATE ON public.competitions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 4. COMPETITION PARTICIPANTS TABLE
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
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_type, target_id);

-- ============================================================================
-- 8. ROW LEVEL SECURITY & HELPER FUNCTIONS
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_organizer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('organizer', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Scoring Versions Policies
DROP POLICY IF EXISTS "Scoring versions are viewable by authenticated users" ON public.scoring_versions;
CREATE POLICY "Scoring versions are viewable by authenticated users" ON public.scoring_versions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can insert scoring versions" ON public.scoring_versions;
CREATE POLICY "Admins can insert scoring versions" ON public.scoring_versions FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update scoring versions" ON public.scoring_versions;
CREATE POLICY "Admins can update scoring versions" ON public.scoring_versions FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Competitions Policies
DROP POLICY IF EXISTS "Published competitions are viewable by all" ON public.competitions;
CREATE POLICY "Published competitions are viewable by all" ON public.competitions FOR SELECT USING (
    status IN ('scheduled', 'active', 'scoring', 'completed')
    OR organizer_id = auth.uid()
    OR public.is_admin()
);

DROP POLICY IF EXISTS "Organizers can create competitions" ON public.competitions;
CREATE POLICY "Organizers can create competitions" ON public.competitions FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = organizer_id AND public.is_organizer()
);

DROP POLICY IF EXISTS "Organizers can update their own competitions" ON public.competitions;
CREATE POLICY "Organizers can update their own competitions" ON public.competitions FOR UPDATE TO authenticated USING (
    organizer_id = auth.uid() OR public.is_admin()
) WITH CHECK (
    organizer_id = auth.uid() OR public.is_admin()
);

-- Competition Participants Policies
DROP POLICY IF EXISTS "Participants list viewable by authenticated users" ON public.competition_participants;
CREATE POLICY "Participants list viewable by authenticated users" ON public.competition_participants FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can join active competitions" ON public.competition_participants;
CREATE POLICY "Users can join active competitions" ON public.competition_participants FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.competitions c
        WHERE c.id = competition_id AND c.status IN ('scheduled', 'active')
    )
);

DROP POLICY IF EXISTS "Manage participation status" ON public.competition_participants;
CREATE POLICY "Manage participation status" ON public.competition_participants FOR UPDATE TO authenticated USING (
    auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.competitions c
        WHERE c.id = competition_id AND (c.organizer_id = auth.uid() OR public.is_admin())
    )
);

-- Submissions Policies
DROP POLICY IF EXISTS "View submissions" ON public.submissions;
CREATE POLICY "View submissions" ON public.submissions FOR SELECT TO authenticated USING (
    participant_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.competitions c
        WHERE c.id = competition_id AND (
            c.organizer_id = auth.uid()
            OR public.is_admin()
            OR (c.status = 'completed' AND c.leaderboard_visibility = 'public')
        )
    )
);

DROP POLICY IF EXISTS "Participants can create submissions" ON public.submissions;
CREATE POLICY "Participants can create submissions" ON public.submissions FOR INSERT TO authenticated WITH CHECK (
    participant_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.competitions c
        WHERE c.id = competition_id AND c.status = 'active'
        AND now() >= c.starts_at AND now() <= c.ends_at
    )
    AND EXISTS (
        SELECT 1 FROM public.competition_participants cp
        WHERE cp.competition_id = competition_id AND cp.user_id = auth.uid() AND cp.status = 'active'
    )
);

-- Scores Policies
DROP POLICY IF EXISTS "View scores" ON public.scores;
CREATE POLICY "View scores" ON public.scores FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.submissions s
        JOIN public.competitions c ON c.id = s.competition_id
        WHERE s.id = submission_id
        AND (
            s.participant_id = auth.uid()
            OR c.organizer_id = auth.uid()
            OR public.is_admin()
            OR c.leaderboard_visibility = 'public'
        )
    )
);

-- Audit Logs Policies
DROP POLICY IF EXISTS "Audit logs viewable by organizers and admins" ON public.audit_logs;
CREATE POLICY "Audit logs viewable by organizers and admins" ON public.audit_logs FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR public.is_admin()
);

-- ============================================================================
-- 9. INITIAL SEED DATA
-- ============================================================================
INSERT INTO public.scoring_versions (
    id,
    name,
    version,
    model_versions,
    preprocessing_version,
    metric_weights,
    normalization_config,
    is_active
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'AI Image Judge Standard Ensemble v1.0',
    'v1.0.0',
    '{
        "dreamsim": "dino_vitb16",
        "dino": "dinov2_vits14",
        "clip": "ViT-B-32-openai",
        "lpips": "alex",
        "color": "lab_histogram_wasserstein_v1",
        "quality": "laplacian_contrast_v1"
    }'::jsonb,
    'v1',
    '{
        "dreamsim": 0.35,
        "dino": 0.30,
        "clip": 0.15,
        "lpips": 0.10,
        "color": 0.05,
        "quality": 0.05
    }'::jsonb,
    '{
        "dreamsim": { "type": "distance_to_similarity", "scale": 1.0, "min": 0.0, "max": 1.0 },
        "dino": { "type": "cosine_similarity", "min_clip": 0.0, "max_clip": 1.0 },
        "clip": { "type": "cosine_similarity", "min_clip": 0.0, "max_clip": 1.0 },
        "lpips": { "type": "distance_to_similarity", "scale": 1.0, "min": 0.0, "max": 1.0 },
        "color": { "type": "similarity_score", "min_clip": 0.0, "max_clip": 1.0 },
        "quality": { "type": "quality_heuristic", "min_clip": 0.0, "max_clip": 1.0 }
    }'::jsonb,
    true
)
ON CONFLICT (version) DO NOTHING;

