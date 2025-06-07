-- FIX FOR RLS INFINITE RECURSION ISSUE
-- Apply this to fix the recursive policy problem

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

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their clubs" ON public.club_members;
DROP POLICY IF EXISTS "Club owners can add members" ON public.club_members;
DROP POLICY IF EXISTS "Club owners can update member roles" ON public.club_members;
DROP POLICY IF EXISTS "Members can leave, owners can remove members" ON public.club_members;
DROP POLICY IF EXISTS "Club owners and admins can invite members" ON public.club_members;
DROP POLICY IF EXISTS "Users can accept or decline invitations" ON public.club_members;
DROP POLICY IF EXISTS "View invitations appropriately" ON public.club_members;

-- Recreate policies using helper functions (no recursion)
CREATE POLICY "Users can view members of their clubs"
ON public.club_members FOR SELECT
USING (check_user_club_membership(auth.uid(), club_id));

CREATE POLICY "Club owners can add members"
ON public.club_members FOR INSERT
WITH CHECK (check_user_club_role(auth.uid(), club_id, ARRAY['owner']));

CREATE POLICY "Club owners can update member roles"
ON public.club_members FOR UPDATE
USING (check_user_club_role(auth.uid(), club_id, ARRAY['owner']));

CREATE POLICY "Members can leave, owners can remove members"
ON public.club_members FOR DELETE
USING (
    -- User can remove themselves
    auth.uid() = user_id
    OR
    -- Club owner can remove anyone
    check_user_club_role(auth.uid(), club_id, ARRAY['owner'])
);

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

-- Grant permissions to the helper functions
GRANT EXECUTE ON FUNCTION check_user_club_role(UUID, UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_club_membership(UUID, UUID) TO authenticated;
