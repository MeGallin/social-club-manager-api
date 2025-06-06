const express = require('express');
const {
  getMyProfile,
  getProfileById,
  getAllProfiles,
  updateMyProfile,
  updateProfileById,
  createProfile,
  deleteProfile,
  checkProfileExists,
} = require('../controllers/profileController');
const {
  extractUserId,
  authenticateToken,
  requireAdmin,
} = require('../middlewares/auth');

const router = express.Router();

/**
 * Profile Routes
 *
 * Note: These routes support both JWT authentication and x-user-id header for backward compatibility
 * In production, JWT authentication should be used exclusively
 */

// @desc    Get current user's profile
// @route   GET /api/profiles/me
// @access  Private
router.get('/me', extractUserId, getMyProfile);

// @desc    Update current user's profile
// @route   PUT /api/profiles/me
// @access  Private
router.put('/me', extractUserId, updateMyProfile);

// @desc    Get all profiles
// @route   GET /api/profiles
// @access  Private (admin only)
router.get('/', getAllProfiles);

// @desc    Create a new profile
// @route   POST /api/profiles
// @access  Private (admin only)
router.post('/', createProfile);

// @desc    Check if profile exists
// @route   GET /api/profiles/:id/exists
// @access  Private
router.get('/:id/exists', checkProfileExists);

// @desc    Get profile by ID
// @route   GET /api/profiles/:id
// @access  Private
router.get('/:id', getProfileById);

// @desc    Update profile by ID
// @route   PUT /api/profiles/:id
// @access  Private (admin only)
router.put('/:id', updateProfileById);

// @desc    Delete profile by ID
// @route   DELETE /api/profiles/:id
// @access  Private (admin only)
router.delete('/:id', deleteProfile);

module.exports = router;
