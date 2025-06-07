const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const {
  createClubOnboarding,
  getOnboardingStatus,
  updateOnboardingStatus,
} = require('../controllers/onboardingController');

const router = express.Router();

// All onboarding routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/onboarding/club
 * @desc    Create a new club via guided onboarding workflow
 * @access  Private (requires authentication)
 */
router.post('/club', createClubOnboarding);

/**
 * @route   GET /api/onboarding/status
 * @desc    Get onboarding status for a club
 * @access  Private (requires authentication and club context)
 */
router.get('/status', getOnboardingStatus);

/**
 * @route   PATCH /api/onboarding/status
 * @desc    Update onboarding status step
 * @access  Private (requires authentication and club admin/owner access)
 */
router.patch('/status', updateOnboardingStatus);

module.exports = router;
