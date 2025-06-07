const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const {
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
} = require('../controllers/clubController');

const router = express.Router();

// All club routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/clubs/my-clubs
 * @desc    Get all clubs created by the current user
 * @access  Private
 */
router.get('/my-clubs', getMyClubs);

/**
 * @route   GET /api/clubs/my-invitations
 * @desc    Get user's pending invitations
 * @access  Private
 */
router.get('/my-invitations', getMyInvitations);

/**
 * @route   POST /api/clubs/join/:inviteCode
 * @desc    Accept an invitation using invite code
 * @access  Private
 */
router.post('/join/:inviteCode', acceptInviteCode);

/**
 * @route   DELETE /api/clubs/invitations/:invitationId
 * @desc    Cancel/revoke an invitation (admin only)
 * @access  Private
 */
router.delete('/invitations/:invitationId', cancelInvitation);

/**
 * @route   POST /api/clubs
 * @desc    Create a new club
 * @access  Private
 */
router.post('/', createClub);

/**
 * @route   GET /api/clubs/:id
 * @desc    Get a specific club by ID
 * @access  Private
 */
router.get('/:id', getClubById);

/**
 * @route   GET /api/clubs/:id/members
 * @desc    Get club members (requires club membership)
 * @access  Private
 */
router.get('/:id/members', getClubMembers);

/**
 * @route   GET /api/clubs/:id/membership
 * @desc    Get user's membership in a club
 * @access  Private
 */
router.get('/:id/membership', getClubMembership);

/**
 * @route   POST /api/clubs/:id/invite-email
 * @desc    Invite a user to join a club by email (admin only)
 * @access  Private
 */
router.post('/:id/invite-email', inviteUserByEmail);

/**
 * @route   POST /api/clubs/:id/invite-code
 * @desc    Generate an invite code for joining a club (admin only)
 * @access  Private
 */
router.post('/:id/invite-code', generateInviteCode);

/**
 * @route   POST /api/clubs/:id/accept-invitation
 * @desc    Accept an email invitation
 * @access  Private
 */
router.post('/:id/accept-invitation', acceptEmailInvitation);

/**
 * @route   GET /api/clubs/:id/invitations
 * @desc    Get pending invitations for a club (admin only)
 * @access  Private
 */
router.get('/:id/invitations', getClubInvitations);

/**
 * @route   PATCH /api/clubs/:id
 * @desc    Update a club (creator only)
 * @access  Private
 */
router.patch('/:id', updateClub);

/**
 * @route   DELETE /api/clubs/:id
 * @desc    Delete a club (creator only)
 * @access  Private
 */
router.delete('/:id', deleteClub);

module.exports = router;
