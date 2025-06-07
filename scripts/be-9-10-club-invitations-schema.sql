-- BE-9-10 Club Invitations Schema Extension
-- Extends the existing club_members table to support invitation functionality
-- This script modifies the existing table structure to accommodate pending invitations

-- First, we need to modify the existing club_members table to support invitations
-- We'll add new columns for invitation functionality

-- Add new columns to support invitations
ALTER TABLE public.club_members 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS invite_status TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE;

-- Make user_id nullable to support pending invitations
ALTER TABLE public.club_members 
ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint to ensure invite_status is valid
ALTER TABLE public.club_members 
ADD CONSTRAINT check_invite_status 
CHECK (invite_status IN ('pending', 'accepted', 'active', 'declined', 'expired'));

-- Add constraint to ensure either user_id or email is present
ALTER TABLE public.club_members 
ADD CONSTRAINT check_user_or_email 
CHECK (user_id IS NOT NULL OR email IS NOT NULL);

-- Drop the existing primary key and create a new one
ALTER TABLE public.club_members DROP CONSTRAINT club_members_pkey;

-- Add a new ID column for better management of invitations
ALTER TABLE public.club_members 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

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
    (invite_status = 'pending' AND (
        EXISTS (
            SELECT 1 FROM public.club_members cm 
            WHERE cm.club_id = club_members.club_id 
            AND cm.user_id = auth.uid() 
            AND cm.role IN ('owner', 'admin')
            AND cm.invite_status = 'active'
        )
    ))
    OR
    -- Allow accepting invitations (converting pending to active)
    (invite_status = 'active' AND user_id = auth.uid())
);

-- Policy: Users can update their own invitation status (accept/decline)
CREATE POLICY "Users can accept or decline invitations"
ON public.club_members FOR UPDATE
USING (
    -- User can update their own invitation
    (user_id = auth.uid() OR 
     (user_id IS NULL AND EXISTS (
         SELECT 1 FROM auth.users au 
         WHERE au.id = auth.uid() 
         AND au.email = club_members.email
     )))
    OR
    -- Club owners can update member roles and invitation status
    EXISTS (
        SELECT 1 FROM public.club_members cm 
        WHERE cm.club_id = club_members.club_id 
        AND cm.user_id = auth.uid() 
        AND cm.role = 'owner'
        AND cm.invite_status = 'active'
    )
);

-- Policy: View pending invitations - admins can see all, users can see their own
CREATE POLICY "View invitations appropriately"
ON public.club_members FOR SELECT
USING (
    -- Users can view their own memberships and invitations
    (auth.uid() = user_id)
    OR
    -- Users can view invitations sent to their email
    (user_id IS NULL AND EXISTS (
        SELECT 1 FROM auth.users au 
        WHERE au.id = auth.uid() 
        AND au.email = club_members.email
    ))
    OR
    -- Users can view all members of clubs they belong to
    EXISTS (
        SELECT 1 FROM public.club_members cm 
        WHERE cm.club_id = club_members.club_id 
        AND cm.user_id = auth.uid()
        AND cm.invite_status = 'active'
    )
);

-- Function to generate secure invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
BEGIN
    -- Use base64 encoding and make it URL-safe
    RETURN REPLACE(REPLACE(encode(gen_random_bytes(16), 'base64'), '+', '-'), '/', '_');
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

-- Comments for documentation
COMMENT ON COLUMN public.club_members.email IS 'Email address for pending invitations (when user_id is null)';
COMMENT ON COLUMN public.club_members.invite_status IS 'Status of invitation: pending, accepted, active, declined, expired';
COMMENT ON COLUMN public.club_members.invite_code IS 'Unique code for invite link acceptance';
COMMENT ON COLUMN public.club_members.invited_by IS 'User ID of the person who sent the invitation';
COMMENT ON COLUMN public.club_members.invited_at IS 'Timestamp when invitation was sent';

-- Grant permissions to the functions
GRANT EXECUTE ON FUNCTION generate_invite_code() TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_invitations() TO service_role;
