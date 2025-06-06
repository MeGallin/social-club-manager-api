const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const {
  createClub,
  getClubById,
  updateClub,
  deleteClub,
  getMyClubs,
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
