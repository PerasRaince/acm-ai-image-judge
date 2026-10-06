-- 00001_rls_policies.sql
-- AI Image Judge Platform - Row Level Security (RLS) Policies
-- Enforces least-privilege access across all data entities.

-- Enable Row Level Security on all tables
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

-- Helper function to check if the current user has organizer role
CREATE OR REPLACE FUNCTION public.is_organizer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('organizer', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 1. PROFILES POLICIES
-- ============================================================================
-- Anyone can view public profiles (needed for leaderboards, organizer displays)
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. SCORING VERSIONS POLICIES
-- ============================================================================
-- Scoring versions are visible to all authenticated users
CREATE POLICY "Scoring versions are viewable by authenticated users"
    ON public.scoring_versions FOR SELECT
    TO authenticated
    USING (true);

-- Only admins can create or update scoring versions
CREATE POLICY "Admins can insert scoring versions"
    ON public.scoring_versions FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update scoring versions"
    ON public.scoring_versions FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- 3. COMPETITIONS POLICIES
-- ============================================================================
-- Public / authenticated can view published competitions (scheduled, active, scoring, completed)
-- Draft and cancelled are visible only to the owning organizer or admins
CREATE POLICY "Published competitions are viewable by all"
    ON public.competitions FOR SELECT
    USING (
        status IN ('scheduled', 'active', 'scoring', 'completed')
        OR organizer_id = auth.uid()
        OR public.is_admin()
    );

-- Only organizers and admins can create competitions
CREATE POLICY "Organizers can create competitions"
    ON public.competitions FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = organizer_id
        AND public.is_organizer()
    );

-- Organizers can update their own competitions (or admins)
CREATE POLICY "Organizers can update their own competitions"
    ON public.competitions FOR UPDATE
    TO authenticated
    USING (
        organizer_id = auth.uid()
        OR public.is_admin()
    )
    WITH CHECK (
        organizer_id = auth.uid()
        OR public.is_admin()
    );

-- ============================================================================
-- 4. COMPETITION PARTICIPANTS POLICIES
-- ============================================================================
-- Participants can view competition participants
CREATE POLICY "Participants list viewable by authenticated users"
    ON public.competition_participants FOR SELECT
    TO authenticated
    USING (true);

-- Users can join competitions as themselves
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

-- Users can withdraw themselves or organizers can manage
CREATE POLICY "Manage participation status"
    ON public.competition_participants FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.competitions c
            WHERE c.id = competition_id
            AND (c.organizer_id = auth.uid() OR public.is_admin())
        )
    );

-- ============================================================================
-- 5. SUBMISSIONS POLICIES
-- ============================================================================
-- Submissions viewable by owner, competition organizer, or anyone if competition completed and public
CREATE POLICY "View submissions"
    ON public.submissions FOR SELECT
    TO authenticated
    USING (
        participant_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.competitions c
            WHERE c.id = competition_id
            AND (
                c.organizer_id = auth.uid()
                OR public.is_admin()
                OR (c.status = 'completed' AND c.leaderboard_visibility = 'public')
            )
        )
    );

-- Participants can submit recreation attempts
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
-- Scores viewable by submission owner, organizer, or leaderboard viewers
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
                OR c.organizer_id = auth.uid()
                OR public.is_admin()
                OR c.leaderboard_visibility = 'public'
            )
        )
    );

-- Modification of scores is restricted to service_role (backend trusted runner).
-- Normal authenticated users have NO INSERT or UPDATE privileges on scores.

-- ============================================================================
-- 7. AUDIT LOGS POLICIES
-- ============================================================================
CREATE POLICY "Audit logs viewable by organizers and admins"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR public.is_admin()
    );

