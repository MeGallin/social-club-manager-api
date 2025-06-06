const express = require('express');
const {
  registerUser,
  loginUser,
  logoutUser,
  refreshSession,
  verifyToken,
  getCurrentUser,
} = require('../controllers/authController');

const router = express.Router();

/**
 * Authentication Routes
 *
 * All auth routes are public except where noted
 * JWT tokens are returned for successful auth operations
 */

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', registerUser);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', loginUser);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', logoutUser);

// @desc    Refresh user session
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', refreshSession);

// @desc    Verify JWT token
// @route   GET /api/auth/verify
// @access  Private
router.get('/verify', verifyToken);

// @desc    Get current user info
// @route   GET /api/auth/me
// @access  Private
router.get('/me', getCurrentUser);

module.exports = router;
