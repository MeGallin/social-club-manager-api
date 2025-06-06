const profileService = require('../services/profileService');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * Profile Controller
 * Handles HTTP requests for profile operations
 */

/**
 * @desc    Get current user's profile
 * @route   GET /api/profiles/me
 * @access  Private (requires authentication)
 */
const getMyProfile = asyncHandler(async (req, res) => {
  // User ID is extracted by auth middleware
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required. Authentication failed.',
    });
  }

  const profile = await profileService.getProfile(userId);

  res.status(200).json({
    success: true,
    data: profile,
  });
});

/**
 * @desc    Get user profile by ID
 * @route   GET /api/profiles/:id
 * @access  Private (requires authentication)
 */
const getProfileById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const profile = await profileService.getProfile(id);

  res.status(200).json({
    success: true,
    data: profile,
  });
});

/**
 * @desc    Get all profiles
 * @route   GET /api/profiles
 * @access  Private (admin only)
 */
const getAllProfiles = asyncHandler(async (req, res) => {
  const { limit, offset } = req.query;

  const filters = {};
  if (limit) filters.limit = parseInt(limit);
  if (offset) filters.offset = parseInt(offset);

  const profiles = await profileService.getAllProfiles(filters);

  res.status(200).json({
    success: true,
    count: profiles.length,
    data: profiles,
  });
});

/**
 * @desc    Update current user's profile
 * @route   PUT /api/profiles/me
 * @access  Private (requires authentication)
 */
const updateMyProfile = asyncHandler(async (req, res) => {
  // User ID is extracted by auth middleware
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required. Authentication failed.',
    });
  }

  const { full_name, avatar_url } = req.body;

  // Validate input
  if (!full_name && !avatar_url) {
    return res.status(400).json({
      success: false,
      error: 'At least one field (full_name or avatar_url) is required',
    });
  }

  const profileData = {};
  if (full_name) profileData.full_name = full_name;
  if (avatar_url) profileData.avatar_url = avatar_url;

  const updatedProfile = await profileService.updateProfile(
    userId,
    profileData,
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedProfile,
  });
});

/**
 * @desc    Update profile by ID
 * @route   PUT /api/profiles/:id
 * @access  Private (admin only)
 */
const updateProfileById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, avatar_url } = req.body;

  // Validate input
  if (!full_name && !avatar_url) {
    return res.status(400).json({
      success: false,
      error: 'At least one field (full_name or avatar_url) is required',
    });
  }

  const profileData = {};
  if (full_name) profileData.full_name = full_name;
  if (avatar_url) profileData.avatar_url = avatar_url;

  const updatedProfile = await profileService.updateProfile(id, profileData);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedProfile,
  });
});

/**
 * @desc    Create a new profile (manual creation)
 * @route   POST /api/profiles
 * @access  Private (admin only)
 */
const createProfile = asyncHandler(async (req, res) => {
  const { id, full_name, avatar_url } = req.body;

  // Validate required fields
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required',
    });
  }

  // Check if profile already exists
  const exists = await profileService.profileExists(id);
  if (exists) {
    return res.status(409).json({
      success: false,
      error: 'Profile already exists for this user',
    });
  }

  const profileData = { id };
  if (full_name) profileData.full_name = full_name;
  if (avatar_url) profileData.avatar_url = avatar_url;

  const newProfile = await profileService.createProfile(profileData);

  res.status(201).json({
    success: true,
    message: 'Profile created successfully',
    data: newProfile,
  });
});

/**
 * @desc    Delete profile by ID
 * @route   DELETE /api/profiles/:id
 * @access  Private (admin only)
 */
const deleteProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if profile exists
  const exists = await profileService.profileExists(id);
  if (!exists) {
    return res.status(404).json({
      success: false,
      error: 'Profile not found',
    });
  }

  await profileService.deleteProfile(id);

  res.status(200).json({
    success: true,
    message: 'Profile deleted successfully',
  });
});

/**
 * @desc    Check if profile exists
 * @route   GET /api/profiles/:id/exists
 * @access  Private
 */
const checkProfileExists = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exists = await profileService.profileExists(id);

  res.status(200).json({
    success: true,
    exists: exists,
  });
});

module.exports = {
  getMyProfile,
  getProfileById,
  getAllProfiles,
  updateMyProfile,
  updateProfileById,
  createProfile,
  deleteProfile,
  checkProfileExists,
};
