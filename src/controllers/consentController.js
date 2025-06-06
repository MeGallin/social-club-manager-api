const { asyncHandler } = require('../middlewares/errorHandler');
const profileService = require('../services/profileService');

/**
 * Consent Controller
 * Handles HTTP requests for GDPR/Privacy consent operations
 */

/**
 * @desc    Get user's consent status
 * @route   GET /api/profile/consent
 * @access  Private (requires JWT)
 */
const getConsent = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await profileService.getProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        consent: profile.consent || false,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve consent status',
    });
  }
});

/**
 * @desc    Update user's consent status
 * @route   PUT /api/profile/consent
 * @access  Private (requires JWT)
 */
const updateConsent = asyncHandler(async (req, res) => {
  const { consent } = req.body;

  // Validate consent field
  if (typeof consent !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: 'Consent must be a boolean value (true or false)',
    });
  }

  try {
    const userId = req.user.id;

    const updatedProfile = await profileService.updateConsent(userId, consent);

    res.status(200).json({
      success: true,
      message: 'Consent status updated successfully',
      data: {
        consent: updatedProfile.consent,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update consent status',
    });
  }
});

module.exports = {
  getConsent,
  updateConsent,
};
