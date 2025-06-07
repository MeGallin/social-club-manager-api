const clubService = require('../services/clubService');
const onboardingService = require('../services/onboardingService');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * Club Controller
 * Handles HTTP requests for club operations
 */

/**
 * @desc    Create a new club
 * @route   POST /api/clubs
 * @access  Private (requires authentication)
 */
const createClub = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, type, description, logo_url, enabled_modules } = req.body;

  // Validate required fields
  if (!name || !type) {
    return res.status(400).json({
      success: false,
      error: 'Name and type are required fields',
    });
  }

  try {
    const club = await clubService.createClub(
      {
        name,
        type,
        description,
        logo_url,
        enabled_modules,
      },
      userId,
    );

    res.status(201).json({
      success: true,
      data: club,
      message: 'Club created successfully',
    });
  } catch (error) {
    // Handle validation and business logic errors
    if (
      error.message.includes('Validation failed') ||
      error.message.includes('A club with this name already exists')
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Re-throw other errors to be handled by errorHandler middleware
    throw error;
  }
});

/**
 * @desc    Get a club by ID
 * @route   GET /api/clubs/:id
 * @access  Private (requires authentication)
 */
const getClubById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required',
    });
  }

  const club = await clubService.getClubById(id);

  if (!club) {
    return res.status(404).json({
      success: false,
      error: 'Club not found',
    });
  }

  res.status(200).json({
    success: true,
    data: club,
  });
});

/**
 * @desc    Update a club
 * @route   PATCH /api/clubs/:id
 * @access  Private (requires authentication, club creator only)
 */
const updateClub = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required',
    });
  }

  // Check if there are any updates to apply
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No updates provided',
    });
  }

  try {
    const club = await clubService.updateClub(id, updates, userId);

    res.status(200).json({
      success: true,
      data: club,
      message: 'Club updated successfully',
    });
  } catch (error) {
    // Handle specific error types
    if (error.message === 'Club not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === 'Only the club creator can update this club') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    if (
      error.message.includes('Validation failed') ||
      error.message.includes('A club with this name already exists')
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Re-throw other errors to be handled by errorHandler middleware
    throw error;
  }
});

/**
 * @desc    Delete a club
 * @route   DELETE /api/clubs/:id
 * @access  Private (requires authentication, club creator only)
 */
const deleteClub = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required',
    });
  }

  try {
    await clubService.deleteClub(id, userId);

    res.status(204).send(); // 204 No Content for successful deletion
  } catch (error) {
    // Handle specific error types
    if (error.message === 'Club not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === 'Only the club creator can delete this club') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    // Re-throw other errors to be handled by errorHandler middleware
    throw error;
  }
});

/**
 * @desc    Get clubs for the current user
 * @route   GET /api/clubs/my-clubs
 * @access  Private (requires authentication)
 */
const getMyClubs = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const clubs = await clubService.getClubsByCreator(userId);

  res.status(200).json({
    success: true,
    data: clubs,
    count: clubs.length,
  });
});

/**
 * @desc    Get club members
 * @route   GET /api/clubs/:id/members
 * @access  Private (requires club membership)
 */
const getClubMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required',
    });
  }

  try {
    const members = await clubService.getClubMembers(id, userId);

    res.status(200).json({
      success: true,
      data: members,
      count: members.length,
    });
  } catch (error) {
    if (error.message.includes('must be a club member')) {
      return res.status(403).json({
        success: false,
        error: 'You must be a club member to view the member list',
      });
    }
    throw error;
  }
});

/**
 * @desc    Get user's membership in a club
 * @route   GET /api/clubs/:id/membership
 * @access  Private (requires authentication)
 */
const getClubMembership = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required',
    });
  }

  const membership = await clubService.getUserClubMembership(id, userId);

  if (!membership) {
    return res.status(404).json({
      success: false,
      error: 'You are not a member of this club',
    });
  }

  res.status(200).json({
    success: true,
    data: membership,
  });
});

/**
 * @desc    Invite a user to join a club by email
 * @route   POST /api/clubs/:id/invite-email
 * @access  Private (requires admin permissions)
 */
const inviteUserByEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { email, role = 'member' } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required',
    });
  }

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required',
    });
  }

  try {
    const invitation = await clubService.inviteUserByEmail(
      id,
      email,
      role,
      userId,
    );

    // Auto-update onboarding status for member invitation
    try {
      await onboardingService.autoUpdateOnboardingStatus(id, 'member_invited', {
        email,
        role,
        invitation_id: invitation.id,
      });
    } catch (onboardingError) {
      console.warn(
        'Failed to update onboarding status:',
        onboardingError.message,
      );
      // Don't fail the invitation if onboarding update fails
    }

    res.status(201).json({
      success: true,
      data: invitation,
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    if (
      error.message.includes('Only club owners and admins') ||
      error.message.includes('Invalid email format') ||
      error.message.includes('Role must be') ||
      error.message.includes('already been sent') ||
      error.message.includes('already a member')
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    throw error;
  }
});

/**
 * @desc    Generate an invite code for joining a club
 * @route   POST /api/clubs/:id/invite-code
 * @access  Private (requires admin permissions)
 */
const generateInviteCode = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { role = 'member' } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required',
    });
  }

  try {
    const invitation = await clubService.generateInviteCode(id, role, userId);

    // Auto-update onboarding status for invite code generation
    try {
      await onboardingService.autoUpdateOnboardingStatus(id, 'member_invited', {
        role,
        invite_code: invitation.invite_code,
        invitation_id: invitation.id,
      });
    } catch (onboardingError) {
      console.warn(
        'Failed to update onboarding status:',
        onboardingError.message,
      );
      // Don't fail the invite code generation if onboarding update fails
    }

    res.status(201).json({
      success: true,
      data: invitation,
      message: 'Invite code generated successfully',
    });
  } catch (error) {
    if (
      error.message.includes('Only club owners and admins') ||
      error.message.includes('Role must be')
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    throw error;
  }
});

/**
 * @desc    Accept an invitation using invite code
 * @route   POST /api/clubs/join/:inviteCode
 * @access  Private (requires authentication)
 */
const acceptInviteCode = asyncHandler(async (req, res) => {
  const { inviteCode } = req.params;
  const userId = req.user.id;

  if (!inviteCode) {
    return res.status(400).json({
      success: false,
      error: 'Invite code is required',
    });
  }

  try {
    const membership = await clubService.acceptInviteCode(inviteCode, userId);

    // Auto-update onboarding status for accepted invite code
    try {
      await onboardingService.autoUpdateOnboardingStatus(
        membership.club_id,
        'member_invited',
        {
          user_id: userId,
          role: membership.role,
          invite_code: inviteCode,
          accepted: true,
        },
      );
    } catch (onboardingError) {
      console.warn(
        'Failed to update onboarding status:',
        onboardingError.message,
      );
      // Don't fail the acceptance if onboarding update fails
    }

    res.status(200).json({
      success: true,
      data: membership,
      message: 'Successfully joined the club',
    });
  } catch (error) {
    if (
      error.message.includes('Invalid or expired') ||
      error.message.includes('already a member')
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    throw error;
  }
});

/**
 * @desc    Accept an email invitation
 * @route   POST /api/clubs/:id/accept-invitation
 * @access  Private (requires authentication)
 */
const acceptEmailInvitation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userEmail = req.user.email;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required',
    });
  }

  try {
    const membership = await clubService.acceptEmailInvitation(
      id,
      userId,
      userEmail,
    );

    // Auto-update onboarding status for accepted invitation
    try {
      await onboardingService.autoUpdateOnboardingStatus(id, 'member_invited', {
        user_id: userId,
        email: userEmail,
        role: membership.role,
        accepted: true,
      });
    } catch (onboardingError) {
      console.warn(
        'Failed to update onboarding status:',
        onboardingError.message,
      );
      // Don't fail the acceptance if onboarding update fails
    }

    res.status(200).json({
      success: true,
      data: membership,
      message: 'Successfully accepted invitation',
    });
  } catch (error) {
    if (
      error.message.includes('No pending invitation') ||
      error.message.includes('Unable to verify user')
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    throw error;
  }
});

/**
 * @desc    Get pending invitations for a club
 * @route   GET /api/clubs/:id/invitations
 * @access  Private (requires admin permissions)
 */
const getClubInvitations = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required',
    });
  }

  try {
    const invitations = await clubService.getClubInvitations(id, userId);

    res.status(200).json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    if (error.message.includes('Only club owners and admins')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    throw error;
  }
});

/**
 * @desc    Cancel/revoke an invitation
 * @route   DELETE /api/clubs/invitations/:invitationId
 * @access  Private (requires admin permissions)
 */
const cancelInvitation = asyncHandler(async (req, res) => {
  const { invitationId } = req.params;
  const userId = req.user.id;

  if (!invitationId) {
    return res.status(400).json({
      success: false,
      error: 'Invitation ID is required',
    });
  }

  try {
    await clubService.cancelInvitation(invitationId, userId);

    res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully',
    });
  } catch (error) {
    if (
      error.message.includes('Invitation not found') ||
      error.message.includes('Only pending invitations') ||
      error.message.includes('Only club owners and admins')
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    throw error;
  }
});

/**
 * @desc    Get user's pending invitations
 * @route   GET /api/clubs/my-invitations
 * @access  Private (requires authentication)
 */
const getMyInvitations = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;

  try {
    const invitations = await clubService.getUserPendingInvitations(
      userId,
      userEmail,
    );

    res.status(200).json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    if (error.message.includes('Unable to verify user')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    throw error;
  }
});

module.exports = {
  createClub,
  getClubById,
  updateClub,
  deleteClub,
  getMyClubs,
  getClubMembers,
  getClubMembership,
  inviteUserByEmail,
  generateInviteCode,
  acceptInviteCode,
  acceptEmailInvitation,
  getClubInvitations,
  cancelInvitation,
  getMyInvitations,
};
