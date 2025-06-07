-- FIX FOR AUTH.USERS PERMISSION ISSUE
-- Apply this to fix the permission denied error

-- Drop the problematic policies that reference auth.users table
DROP POLICY IF EXISTS "Users can accept or decline invitations" ON public.club_members;
DROP POLICY IF EXISTS "View invitations appropriately" ON public.club_members;

-- Recreate policies using auth.email() function instead of auth.users table
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
