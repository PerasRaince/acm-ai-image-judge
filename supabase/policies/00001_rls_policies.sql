-- 00001_rls_policies.sql
-- AI Image Judge Platform - Row Level Security (RLS) Policies
-- User-driven model: Any authenticated user can host competitions.
-- Creator automatically becomes the owner/host of that specific competition.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 1. PROFILES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. SCORING VERSIONS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Scoring versions are viewable by authenticated users" ON public.scoring_versions;
CREATE POLICY "Scoring versions are viewable by authenticated users"
    ON public.scoring_versions FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can insert scoring versions" ON public.scoring_versions;
CREATE POLICY "Admins can insert scoring versions"
    ON public.scoring_versions FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update scoring versions" ON public.scoring_versions;
CREATE POLICY "Admins can update scoring versions"
    ON public.scoring_versions FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- 3. COMPETITIONS POLICIES
-- ============================================================================
-- Public / authenticated can view published competitions or resolve by code
DROP POLICY IF EXISTS "Published competitions are viewable by all" ON public.competitions;
CREATE POLICY "Published competitions are viewable by all"
    ON public.competitions FOR SELECT
    USING (
        status IN ('scheduled', 'active', 'scoring', 'completed')
        OR host_id = auth.uid()
        OR public.is_admin()
    );

-- Any authenticated user can create a competition as the host!
DROP POLICY IF EXISTS "Organizers can create competitions" ON public.competitions;
DROP POLICY IF EXISTS "Authenticated users can create competitions as host" ON public.competitions;
CREATE POLICY "Authenticated users can create competitions as host"
    ON public.competitions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = host_id);

-- Only the host of that specific competition (or admin) can update it
DROP POLICY IF EXISTS "Organizers can update their own competitions" ON public.competitions;
DROP POLICY IF EXISTS "Hosts can update their own competitions" ON public.competitions;
CREATE POLICY "Hosts can update their own competitions"
    ON public.competitions FOR UPDATE
    TO authenticated
    USING (host_id = auth.uid() OR public.is_admin())
    WITH CHECK (host_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- 4. COMPETITION PARTICIPANTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Participants list viewable by authenticated users" ON public.competition_participants;
CREATE POLICY "Participants list viewable by authenticated users"
    ON public.competition_participants FOR SELECT
    TO authenticated
    USING (true);

-- Any authenticated user can join an active/scheduled competition as themselves
DROP POLICY IF EXISTS "Users can join active competitions" ON public.competition_participants;
CREATE POLICY "Users can join active competitions"
    ON public.competition_participants FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.competitions c
            WHERE c.id = competition_id
            AND c.status IN ('scheduled', 'active')
        )
    );

DROP POLICY IF EXISTS "Manage participation status" ON public.competition_participants;
CREATE POLICY "Manage participation status"
    ON public.competition_participants FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.competitions c
            WHERE c.id = competition_id
            AND (c.host_id = auth.uid() OR public.is_admin())
        )
    );

-- ============================================================================
-- 5. SUBMISSIONS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "View submissions" ON public.submissions;
CREATE POLICY "View submissions"
    ON public.submissions FOR SELECT
    TO authenticated
    USING (
        participant_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.competitions c
            WHERE c.id = competition_id
            AND (
                c.host_id = auth.uid()
                OR public.is_admin()
                OR (c.status = 'completed' AND c.leaderboard_visibility = 'public')
            )
        )
    );

DROP POLICY IF EXISTS "Participants can create submissions" ON public.submissions;
CREATE POLICY "Participants can create submissions"
    ON public.submissions FOR INSERT
    TO authenticated
    WITH CHECK (
        participant_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.competitions c
            WHERE c.id = competition_id
            AND c.status = 'active'
            AND now() >= c.starts_at
            AND now() <= c.ends_at
        )
        AND EXISTS (
            SELECT 1 FROM public.competition_participants cp
            WHERE cp.competition_id = competition_id
            AND cp.user_id = auth.uid()
            AND cp.status = 'active'
        )
    );

-- ============================================================================
-- 6. SCORES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "View scores" ON public.scores;
CREATE POLICY "View scores"
    ON public.scores FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.submissions s
            JOIN public.competitions c ON c.id = s.competition_id
            WHERE s.id = submission_id
            AND (
                s.participant_id = auth.uid()
                OR c.host_id = auth.uid()
                OR public.is_admin()
                OR c.leaderboard_visibility = 'public'
            )
        )
    );

-- ============================================================================
-- 7. AUDIT LOGS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Audit logs viewable by organizers and admins" ON public.audit_logs;
CREATE POLICY "Audit logs viewable by hosts and admins"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());
