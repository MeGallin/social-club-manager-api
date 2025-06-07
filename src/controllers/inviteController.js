const ClubService = require('../services/clubService');
const ProfileService = require('../services/profileService');

class InviteController {  /**
   * Accept an invite code to join a club
   * POST /api/invites/accept
   * Body: { "invite_code": "<code>" }
   */
  static async acceptInviteCode(req, res) {
    try {
      const { invite_code } = req.body;
      const userId = req.user.id;

      if (!invite_code) {
        return res.status(400).json({
          success: false,
          message: 'Invite code is required'
        });
      }

      // Use the existing ClubService method to accept invite code
      const membership = await ClubService.acceptInviteCode(invite_code, userId);

      // Get the updated user profile and clubs
      const [profile, clubs] = await Promise.all([
        ProfileService.getProfile(userId),
        ClubService.getUserClubs(userId)
      ]);
      
      res.status(200).json({
        success: true,
        message: 'Successfully joined club',
        data: {
          membership,
          user: {
            id: userId,
            email: req.user.email,
            profile,
            clubs
          }
        }
      });

    } catch (error) {
      console.error('Error accepting invite code:', error);
      
      // Handle specific error messages
      if (error.message.includes('Invalid or expired') || 
          error.message.includes('already a member')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
  /**
   * Get pending invitations for the authenticated user
   * GET /api/invites/pending
   */
  static async getPendingInvitations(req, res) {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email;
      
      const invitations = await ClubService.getUserPendingInvitations(userId, userEmail);

      res.status(200).json({
        success: true,
        data: invitations
      });

    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
  /**
   * Accept an email invitation to join a club
   * POST /api/invites/accept-email
   * Body: { "club_id": "<id>" }
   */
  static async acceptEmailInvitation(req, res) {
    try {
      const { club_id } = req.body;
      const userId = req.user.id;
      const userEmail = req.user.email;

      if (!club_id) {
        return res.status(400).json({
          success: false,
          message: 'Club ID is required'
        });
      }

      // Use the existing ClubService method to accept email invitation
      const membership = await ClubService.acceptEmailInvitation(club_id, userId, userEmail);

      // Get the updated user profile and clubs
      const [profile, clubs] = await Promise.all([
        ProfileService.getProfile(userId),
        ClubService.getUserClubs(userId)
      ]);
      
      res.status(200).json({
        success: true,
        message: 'Successfully joined club',
        data: {
          membership,
          user: {
            id: userId,
            email: userEmail,
            profile,
            clubs
          }
        }
      });

    } catch (error) {
      console.error('Error accepting email invitation:', error);
      
      // Handle specific error messages
      if (error.message.includes('No pending invitation') || 
          error.message.includes('already a member')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = InviteController;
