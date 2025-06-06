const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const {
  createClub,
  getClubById,
  updateClub,
  deleteClub,
  getMyClubs,
  getClubMembers,
  getClubMembership,
} = require('../controllers/clubController');

const router = express.Router();

// All club routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/clubs/my-clubs
 * @desc    Get all clubs created by the current user
 * @access  Private
 */
router.get('/my-clubs', getMyClubs);

/**
 * @route   POST /api/clubs
 * @desc    Create a new club
 * @access  Private
 */
router.post('/', createClub);

/**
 * @route   GET /api/clubs/:id
 * @desc    Get a specific club by ID
 * @access  Private
 */
router.get('/:id', getClubById);

/**
 * @route   GET /api/clubs/:id/members
 * @desc    Get club members (requires club membership)
 * @access  Private
 */
router.get('/:id/members', getClubMembers);

/**
 * @route   GET /api/clubs/:id/membership
 * @desc    Get user's membership in a club
 * @access  Private
 */
router.get('/:id/membership', getClubMembership);

/**
 * @route   PATCH /api/clubs/:id
 * @desc    Update a club (creator only)
 * @access  Private
 */
router.patch('/:id', updateClub);

/**
 * @route   DELETE /api/clubs/:id
 * @desc    Delete a club (creator only)
 * @access  Private
 */
router.delete('/:id', deleteClub);

module.exports = router;
