const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const { createClubOnboarding } = require('../controllers/onboardingController');

const router = express.Router();

// All onboarding routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/onboarding/club
 * @desc    Create a new club via guided onboarding workflow
 * @access  Private (requires authentication)
 */
router.post('/club', createClubOnboarding);

module.exports = router;
