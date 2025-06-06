-- BE-7-8 Club Members Table Schema
-- Supplement to BE-7 and BE-8 implementation
-- This table supports multi-admin functionality and role-based permissions

-- Create the club_members table
CREATE TABLE IF NOT EXISTS public.club_members (
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Composite primary key ensures one role per user per club
    PRIMARY KEY (club_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON public.club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON public.club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_role ON public.club_members(role);

-- Enable Row Level Security
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own memberships
CREATE POLICY "Users can view their own club memberships"
ON public.club_members FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can view all members of clubs they belong to
CREATE POLICY "Users can view members of their clubs"
ON public.club_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.club_members cm 
        WHERE cm.club_id = club_members.club_id 
        AND cm.user_id = auth.uid()
    )
);

-- RLS Policy: Only club owners can insert new members (for now)
CREATE POLICY "Club owners can add members"
ON public.club_members FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.club_members cm 
        WHERE cm.club_id = club_members.club_id 
        AND cm.user_id = auth.uid() 
        AND cm.role = 'owner'
    )
);

-- RLS Policy: Only owners can update member roles
CREATE POLICY "Club owners can update member roles"
ON public.club_members FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.club_members cm 
        WHERE cm.club_id = club_members.club_id 
        AND cm.user_id = auth.uid() 
        AND cm.role = 'owner'
    )
);

-- RLS Policy: Only owners can remove members, members can remove themselves
CREATE POLICY "Members can leave, owners can remove members"
ON public.club_members FOR DELETE
USING (
    -- User can remove themselves
    auth.uid() = user_id
    OR
    -- Club owner can remove anyone
    EXISTS (
        SELECT 1 FROM public.club_members cm 
        WHERE cm.club_id = club_members.club_id 
        AND cm.user_id = auth.uid() 
        AND cm.role = 'owner'
    )
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_members TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.club_members IS 'Stores club membership information and roles for multi-admin support';
COMMENT ON COLUMN public.club_members.role IS 'Member role: owner (creator), admin (elevated permissions), member (standard)';
COMMENT ON COLUMN public.club_members.joined_at IS 'Timestamp when user joined the club or was assigned the role';