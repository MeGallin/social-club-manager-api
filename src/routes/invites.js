const express = require('express');
const router = express.Router();
const InviteController = require('../controllers/inviteController');
const { authenticateToken } = require('../middlewares/auth');

// All invite routes require authentication
router.use(authenticateToken);

/**
 * Accept an invite code
 * POST /api/invites/accept
 * Body: { "invite_code": "<code>" }
 */
router.post('/accept', InviteController.acceptInviteCode);

/**
 * Get pending invitations for the authenticated user
 * GET /api/invites/pending
 */
router.get('/pending', InviteController.getPendingInvitations);

/**
 * Accept an email invitation
 * POST /api/invites/accept-email
 * Body: { "invitation_id": "<id>" }
 */
router.post('/accept-email', InviteController.acceptEmailInvitation);

module.exports = router;
