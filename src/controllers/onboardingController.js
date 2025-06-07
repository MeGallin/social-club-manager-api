const clubService = require('../services/clubService');
const onboardingService = require('../services/onboardingService');
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

    // Initialize onboarding status for the new club
    await onboardingService.initializeOnboardingStatus(
      club.id,
      enabled_modules,
    );

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

/**
 * @desc    Get onboarding status for a club
 * @route   GET /api/onboarding/status
 * @access  Private (requires authentication and club context)
 */
const getOnboardingStatus = asyncHandler(async (req, res) => {
  const { club_id } = req.query;

  // Validate required parameters
  if (!club_id) {
    return res.status(400).json({
      success: false,
      error: 'club_id query parameter is required',
    });
  }

  try {
    // Verify user has access to this club (they should be a member)
    const userClubs = await clubService.getUserClubs(req.user.id);
    const hasAccess = userClubs.some((club) => club.id === club_id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this club.',
      });
    }

    // Get onboarding status
    const onboardingStatus =
      await onboardingService.getOnboardingStatus(club_id);

    res.status(200).json({
      success: true,
      data: onboardingStatus,
      message: 'Onboarding status retrieved successfully',
    });
  } catch (error) {
    if (error.message.includes('Club not found')) {
      return res.status(404).json({
        success: false,
        error: 'Club not found',
      });
    }

    // Re-throw other errors to be handled by errorHandler middleware
    throw error;
  }
});

/**
 * @desc    Update onboarding status step
 * @route   PATCH /api/onboarding/status
 * @access  Private (requires authentication and club context)
 */
const updateOnboardingStatus = asyncHandler(async (req, res) => {
  const { club_id, step, value } = req.body;

  // Validate required parameters
  if (!club_id || !step || value === undefined) {
    return res.status(400).json({
      success: false,
      error: 'club_id, step, and value are required fields',
    });
  }

  try {
    // Verify user has access to this club and is owner/admin
    const userClubs = await clubService.getUserClubs(req.user.id);
    const userClub = userClubs.find((club) => club.id === club_id);

    if (!userClub) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You are not a member of this club.',
      });
    }

    if (!['owner', 'admin'].includes(userClub.role)) {
      return res.status(403).json({
        success: false,
        error:
          'Access denied. Only club owners and admins can update onboarding status.',
      });
    }

    // Update onboarding step
    const updatedStatus = await onboardingService.updateOnboardingStep(
      club_id,
      step,
      value,
    );

    res.status(200).json({
      success: true,
      data: updatedStatus,
      message: `Onboarding step '${step}' updated successfully`,
    });
  } catch (error) {
    if (error.message.includes('Invalid onboarding step')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes('Club not found')) {
      return res.status(404).json({
        success: false,
        error: 'Club not found',
      });
    }

    // Re-throw other errors to be handled by errorHandler middleware
    throw error;
  }
});

module.exports = {
  createClubOnboarding,
  getOnboardingStatus,
  updateOnboardingStatus,
};
