const authService = require('../services/authService');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * Authentication Controller
 * Handles HTTP requests for authentication operations
 */

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, full_name, avatar_url, consent } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required',
    });
  }

  if (!consent || consent !== true) {
    return res.status(400).json({
      success: false,
      error:
        'GDPR consent is required for registration. Consent must be explicitly set to true.',
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid email address',
    });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long',
    });
  }

  try {
    const result = await authService.registerUser({
      email,
      password,
      full_name,
      avatar_url,
      consent,
    });

    // Temporary debugging
    console.log('🔍 Controller received result:', JSON.stringify(result, null, 2));
    console.log('🔍 Session data:', result.session);
    console.log('🔍 Access token:', result.session?.access_token);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          full_name: result.user.user_metadata?.full_name,
          created_at: result.user.created_at,
        },
        access_token: result.session?.access_token,
        refresh_token: result.session?.refresh_token,
        expires_in: result.session?.expires_in,
      },
    });
  } catch (error) {
    // Handle specific error cases
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: 'A user with this email already exists',
      });
    }

    if (error.message.includes('too weak')) {
      return res.status(400).json({
        success: false,
        error: 'Password is too weak. Please use a stronger password',
      });
    }

    // Generic error handling
    return res.status(500).json({
      success: false,
      error: error.message || 'Registration failed',
    });
  }
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required',
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid email address',
    });
  }

  try {
    const result = await authService.loginUser({
      email,
      password,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          full_name: result.user.user_metadata?.full_name,
          created_at: result.user.created_at,
        },
        access_token: result.session?.access_token,
        refresh_token: result.session?.refresh_token,
        expires_in: result.session?.expires_in,
      },
    });
  } catch (error) {
    // Handle specific error cases
    if (error.message.includes('Invalid email or password')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    if (error.message.includes('confirm your email')) {
      return res.status(401).json({
        success: false,
        error: 'Please confirm your email before logging in',
      });
    }

    // Generic error handling
    return res.status(500).json({
      success: false,
      error: error.message || 'Login failed',
    });
  }
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = asyncHandler(async (req, res) => {
  try {
    const result = await authService.logoutUser();

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Logout failed',
    });
  }
});

/**
 * @desc    Refresh user session
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshSession = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token is required',
    });
  }

  try {
    const result = await authService.refreshSession(refresh_token);

    res.status(200).json({
      success: true,
      message: 'Session refreshed successfully',
      data: {
        access_token: result.session?.access_token,
        refresh_token: result.session?.refresh_token,
        expires_in: result.session?.expires_in,
        user: result.user
          ? {
              id: result.user.id,
              email: result.user.email,
              full_name: result.user.user_metadata?.full_name,
            }
          : undefined,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message || 'Session refresh failed',
    });
  }
});

/**
 * @desc    Verify JWT token
 * @route   GET /api/auth/verify
 * @access  Private
 */
const verifyToken = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token is required',
    });
  }

  try {
    const result = await authService.verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({
        success: false,
        error: result.error || 'Invalid token',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          full_name: result.user.user_metadata?.full_name,
        },
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message || 'Token verification failed',
    });
  }
});

/**
 * @desc    Get current user info
 * @route   GET /api/auth/me
 * @access  Private
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token is required',
    });
  }

  try {
    const result = await authService.verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({
        success: false,
        error: result.error || 'Invalid token',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          full_name: result.user.user_metadata?.full_name,
          avatar_url: result.user.user_metadata?.avatar_url,
          created_at: result.user.created_at,
        },
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message || 'Failed to get user info',
    });
  }
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshSession,
  verifyToken,
  getCurrentUser,
};
