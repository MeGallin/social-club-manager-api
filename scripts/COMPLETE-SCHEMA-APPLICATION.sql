-- COMPLETE SCHEMA APPLICATION FOR BE-9-10 INVITATIONS
-- This file contains ALL prerequisite schemas in the correct order
-- Apply this entire file in Supabase SQL Editor

-- ========================================================
-- STEP 1: CREATE CLUBS TABLE (BE-6)
-- ========================================================

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  description text,
  logo_url text,
  creator_id uuid references auth.users(id) on delete set null,
  enabled_modules jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create indexes for clubs table
create unique index if not exists unique_club_name_per_creator
  on public.clubs (creator_id, lower(name));

create index if not exists idx_clubs_creator_id on public.clubs (creator_id);
create index if not exists idx_clubs_type on public.clubs (type);

-- Enable RLS for clubs table
alter table public.clubs enable row level security;

-- RLS Policies for clubs (drop existing if they exist)
DROP POLICY IF EXISTS "Clubs are publicly readable by authenticated users" ON public.clubs;
CREATE POLICY "Clubs are publicly readable by authenticated users"
  ON public.clubs FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create clubs" ON public.clubs;
CREATE POLICY "Users can create clubs"
  ON public.clubs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Club creators can update their own clubs" ON public.clubs;
CREATE POLICY "Club creators can update their own clubs"
  ON public.clubs FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Club creators can delete their own clubs" ON public.clubs;
CREATE POLICY "Club creators can delete their own clubs"
  ON public.clubs FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Comments for clubs table
comment on table public.clubs is 'Stores club information with creator linkage and module configurations';

-- ========================================================
-- STEP 2: CREATE CLUB_MEMBERS TABLE (BE-7-8)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.club_members (
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Composite primary key ensures one role per user per club
    PRIMARY KEY (club_id, user_id)
);

-- Create indexes for club_members table
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON public.club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON public.club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_role ON public.club_members(role);

-- Enable RLS for club_members table
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for club_members (drop existing if they exist)
DROP POLICY IF EXISTS "Users can view their own club memberships" ON public.club_members;
CREATE POLICY "Users can view their own club memberships"
ON public.club_members FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view members of their clubs" ON public.club_members;
CREATE POLICY "Users can view members of their clubs"
ON public.club_members FOR SELECT
USING (check_user_club_membership(auth.uid(), club_id));

DROP POLICY IF EXISTS "Club owners can add members" ON public.club_members;
CREATE POLICY "Club owners can add members"
ON public.club_members FOR INSERT
WITH CHECK (check_user_club_role(auth.uid(), club_id, ARRAY['owner']));

DROP POLICY IF EXISTS "Club owners can update member roles" ON public.club_members;
CREATE POLICY "Club owners can update member roles"
ON public.club_members FOR UPDATE
USING (check_user_club_role(auth.uid(), club_id, ARRAY['owner']));

DROP POLICY IF EXISTS "Members can leave, owners can remove members" ON public.club_members;
CREATE POLICY "Members can leave, owners can remove members"
ON public.club_members FOR DELETE
USING (
    -- User can remove themselves
    auth.uid() = user_id
    OR
    -- Club owner can remove anyone
    check_user_club_role(auth.uid(), club_id, ARRAY['owner'])
);

-- Grant permissions for club_members
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_members TO authenticated;

-- Comments for club_members table
COMMENT ON TABLE public.club_members IS 'Stores club membership information and roles for multi-admin support';

-- ========================================================
-- STEP 3: EXTEND CLUB_MEMBERS FOR INVITATIONS (BE-9-10)
-- ========================================================

-- Drop the existing primary key first (before modifying user_id)
ALTER TABLE public.club_members DROP CONSTRAINT IF EXISTS club_members_pkey;

-- Add a new ID column for better management of invitations
ALTER TABLE public.club_members 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

-- Now we can make user_id nullable since it's no longer part of primary key
ALTER TABLE public.club_members 
ALTER COLUMN user_id DROP NOT NULL;

-- Add new columns to support invitations
ALTER TABLE public.club_members 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS invite_status TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE;

-- Add constraint to ensure invite_status is valid
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_invite_status' 
        AND table_name = 'club_members'
    ) THEN
        ALTER TABLE public.club_members 
        ADD CONSTRAINT check_invite_status 
        CHECK (invite_status IN ('pending', 'accepted', 'active', 'declined', 'expired'));
    END IF;
END $$;

-- Add constraint to ensure either user_id or email is present
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_user_or_email' 
        AND table_name = 'club_members'
    ) THEN
        ALTER TABLE public.club_members 
        ADD CONSTRAINT check_user_or_email 
        CHECK (user_id IS NOT NULL OR email IS NOT NULL);
    END IF;
END $$;

-- Create unique constraint to prevent duplicate active memberships
CREATE UNIQUE INDEX IF NOT EXISTS idx_club_members_unique_active
ON public.club_members(club_id, user_id) 
WHERE user_id IS NOT NULL AND invite_status IN ('active', 'accepted');

-- Create unique constraint to prevent duplicate email invitations per club
CREATE UNIQUE INDEX IF NOT EXISTS idx_club_members_unique_email_pending
ON public.club_members(club_id, email) 
WHERE email IS NOT NULL AND invite_status = 'pending';

-- Create index for invite codes
CREATE INDEX IF NOT EXISTS idx_club_members_invite_code 
ON public.club_members(invite_code) 
WHERE invite_code IS NOT NULL;

-- Create index for invitation status
CREATE INDEX IF NOT EXISTS idx_club_members_invite_status 
ON public.club_members(invite_status);

-- Update RLS policies for invitation functionality

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Club owners can add members" ON public.club_members;

-- Policy: Club owners and admins can invite members (insert pending invitations)
CREATE POLICY "Club owners and admins can invite members"
ON public.club_members FOR INSERT
WITH CHECK (
    -- Allow inserting pending invitations if user is owner or admin
    (invite_status = 'pending' AND 
     check_user_club_role(auth.uid(), club_id, ARRAY['owner', 'admin']))
    OR
    -- Allow accepting invitations (converting pending to active)
    (invite_status = 'active' AND user_id = auth.uid())
);

-- Policy: Users can update their own invitation status (accept/decline)
DROP POLICY IF EXISTS "Users can accept or decline invitations" ON public.club_members;
CREATE POLICY "Users can accept or decline invitations"
ON public.club_members FOR UPDATE
USING (
    -- User can update their own invitation
    (user_id = auth.uid() OR 
     (user_id IS NULL AND auth.email() = club_members.email))
    OR
    -- Club owners can update member roles and invitation status
    check_user_club_role(auth.uid(), club_id, ARRAY['owner'])
);

-- Policy: View pending invitations - admins can see all, users can see their own
DROP POLICY IF EXISTS "View invitations appropriately" ON public.club_members;
CREATE POLICY "View invitations appropriately"
ON public.club_members FOR SELECT
USING (
    -- Users can view their own memberships and invitations
    (auth.uid() = user_id)
    OR
    -- Users can view invitations sent to their email
    (user_id IS NULL AND auth.email() = club_members.email)
    OR
    -- Users can view all members of clubs they belong to
    check_user_club_membership(auth.uid(), club_id)
);

-- Function to generate secure invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
BEGIN
    -- Use base64 encoding and make it URL-safe
    RETURN REPLACE(REPLACE(encode(gen_random_bytes(16), 'base64'), '+', '-'), '/', '_');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has specific role in club (bypasses RLS)
CREATE OR REPLACE FUNCTION check_user_club_role(p_user_id UUID, p_club_id UUID, p_roles TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.club_members
    WHERE user_id = p_user_id 
    AND club_id = p_club_id 
    AND invite_status = 'active'
    LIMIT 1;
    
    RETURN user_role = ANY(p_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is member of club (bypasses RLS)
CREATE OR REPLACE FUNCTION check_user_club_membership(p_user_id UUID, p_club_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.club_members
        WHERE user_id = p_user_id 
        AND club_id = p_club_id 
        AND invite_status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old invitations (utility function)
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE public.club_members 
    SET invite_status = 'expired'
    WHERE invite_status = 'pending' 
    AND invited_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for invitation columns
COMMENT ON COLUMN public.club_members.email IS 'Email address for pending invitations (when user_id is null)';
COMMENT ON COLUMN public.club_members.invite_status IS 'Status of invitation: pending, accepted, active, declined, expired';
COMMENT ON COLUMN public.club_members.invite_code IS 'Unique code for invite link acceptance';
COMMENT ON COLUMN public.club_members.invited_by IS 'User ID of the person who sent the invitation';
COMMENT ON COLUMN public.club_members.invited_at IS 'Timestamp when invitation was sent';

-- Grant permissions to the functions
GRANT EXECUTE ON FUNCTION generate_invite_code() TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_club_role(UUID, UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_club_membership(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_invitations() TO service_role;
