const clubService = require('../services/clubService');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * Club Controller
 * Handles HTTP requests for club operations
 */

/**
 * @desc    Create a new club
 * @route   POST /api/clubs
 * @access  Private (requires authentication)
 */
const createClub = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, type, description, logo_url, enabled_modules } = req.body;

  // Validate required fields
  if (!name || !type) {
    return res.status(400).json({
      success: false,
      error: 'Name and type are required fields',
    });
  }

  try {
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

    res.status(201).json({
      success: true,
      data: club,
      message: 'Club created successfully',
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
 * @desc    Get a club by ID
 * @route   GET /api/clubs/:id
 * @access  Private (requires authentication)
 */
const getClubById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required',
    });
  }

  const club = await clubService.getClubById(id);

  if (!club) {
    return res.status(404).json({
      success: false,
      error: 'Club not found',
    });
  }

  res.status(200).json({
    success: true,
    data: club,
  });
});

/**
 * @desc    Update a club
 * @route   PATCH /api/clubs/:id
 * @access  Private (requires authentication, club creator only)
 */
const updateClub = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required',
    });
  }

  // Check if there are any updates to apply
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No updates provided',
    });
  }

  try {
    const club = await clubService.updateClub(id, updates, userId);

    res.status(200).json({
      success: true,
      data: club,
      message: 'Club updated successfully',
    });
  } catch (error) {
    // Handle specific error types
    if (error.message === 'Club not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === 'Only the club creator can update this club') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

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
 * @desc    Delete a club
 * @route   DELETE /api/clubs/:id
 * @access  Private (requires authentication, club creator only)
 */
const deleteClub = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required',
    });
  }

  try {
    await clubService.deleteClub(id, userId);

    res.status(204).send(); // 204 No Content for successful deletion
  } catch (error) {
    // Handle specific error types
    if (error.message === 'Club not found') {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message === 'Only the club creator can delete this club') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    // Re-throw other errors to be handled by errorHandler middleware
    throw error;
  }
});

/**
 * @desc    Get clubs for the current user
 * @route   GET /api/clubs/my-clubs
 * @access  Private (requires authentication)
 */
const getMyClubs = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const clubs = await clubService.getClubsByCreator(userId);

  res.status(200).json({
    success: true,
    data: clubs,
    count: clubs.length,
  });
});

/**
 * @desc    Get club members
 * @route   GET /api/clubs/:id/members
 * @access  Private (requires club membership)
 */
const getClubMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required',
    });
  }

  try {
    const members = await clubService.getClubMembers(id, userId);

    res.status(200).json({
      success: true,
      data: members,
      count: members.length,
    });
  } catch (error) {
    if (error.message.includes('must be a club member')) {
      return res.status(403).json({
        success: false,
        error: 'You must be a club member to view the member list',
      });
    }
    throw error;
  }
});

/**
 * @desc    Get user's membership in a club
 * @route   GET /api/clubs/:id/membership
 * @access  Private (requires authentication)
 */
const getClubMembership = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Club ID is required',
    });
  }

  const membership = await clubService.getUserClubMembership(id, userId);

  if (!membership) {
    return res.status(404).json({
      success: false,
      error: 'You are not a member of this club',
    });
  }

  res.status(200).json({
    success: true,
    data: membership,
  });
});

module.exports = {
  createClub,
  getClubById,
  updateClub,
  deleteClub,
  getMyClubs,
  getClubMembers,
  getClubMembership,
};
