const clubService = require('../services/clubService');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * Onboarding Controller
 * Handles HTTP requests for club onboarding workflow operations
 */

/**
 * @desc    Create a new club via onboarding workflow
 * @route   POST /api/onboarding/club
 * @access  Private (requires authentication)
 */
const createClubOnboarding = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, type, description, logo_url, enabled_modules, invite_emails } =
    req.body;

  // Validate required fields for onboarding
  if (!name || !type) {
    return res.status(400).json({
      success: false,
      error: 'Name and type are required fields',
    });
  }

  // Onboarding-specific validation: at least one module must be enabled
  if (
    !enabled_modules ||
    !Array.isArray(enabled_modules) ||
    enabled_modules.length === 0
  ) {
    return res.status(400).json({
      success: false,
      error: 'At least one module must be enabled for club onboarding',
    });
  }

  // Note: invite_emails is optional and for future extension per ticket requirements
  if (invite_emails && !Array.isArray(invite_emails)) {
    return res.status(400).json({
      success: false,
      error: 'Invite emails must be an array if provided',
    });
  }

  try {
    // Use existing club service to create the club
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

    // TODO: In future iterations, process invite_emails if provided
    // This would involve queueing invitations for later processing

    // Return success response for onboarding
    res.status(201).json({
      success: true,
      data: club,
      message: 'Club onboarding completed successfully',
      onboarding: {
        completed: true,
        next_steps: [
          'Invite members to your club',
          'Configure club settings',
          'Create your first event',
        ],
      },
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

module.exports = {
  createClubOnboarding,
};
