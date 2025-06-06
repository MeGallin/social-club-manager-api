const authService = require('../services/authService');

/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

/**
 * Middleware to verify JWT token and authenticate user
 * Adds user info to req.user if token is valid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required',
      });
    }

    const result = await authService.verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({
        success: false,
        error: result.error || 'Invalid or expired token',
      });
    }

    // Add user info to request object
    req.user = {
      id: result.user.id,
      email: result.user.email,
      full_name: result.user.user_metadata?.full_name,
      avatar_url: result.user.user_metadata?.avatar_url,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token verification failed',
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info to req.user if token is valid, but doesn't fail if token is missing/invalid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return next(); // Continue without authentication
    }

    const result = await authService.verifyToken(token);

    if (result.valid) {
      // Add user info to request object if token is valid
      req.user = {
        id: result.user.id,
        email: result.user.email,
        full_name: result.user.user_metadata?.full_name,
        avatar_url: result.user.user_metadata?.avatar_url,
      };
    }

    next();
  } catch (error) {
    // Continue without authentication even if token verification fails
    next();
  }
};

/**
 * Middleware to check if user has admin role
 * Should be used after authenticateToken middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  // TODO: Implement role checking when user roles are added
  // For now, allow all authenticated users (to be updated in future sprints)
  // if (!req.user.roles || !req.user.roles.includes('admin')) {
  //   return res.status(403).json({
  //     success: false,
  //     error: 'Admin access required',
  //   });
  // }

  next();
};

/**
 * Middleware to extract user ID from token or header
 * Provides backward compatibility with x-user-id header for testing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const extractUserId = async (req, res, next) => {
  try {
    // First try to get user ID from JWT token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const result = await authService.verifyToken(token);
      if (result.valid) {
        req.userId = result.user.id;
        req.user = {
          id: result.user.id,
          email: result.user.email,
          full_name: result.user.user_metadata?.full_name,
          avatar_url: result.user.user_metadata?.avatar_url,
        };
        return next();
      }
    }

    // Fallback to x-user-id header for testing/backward compatibility
    const userIdHeader = req.headers['x-user-id'];
    if (userIdHeader) {
      req.userId = userIdHeader;
      return next();
    }

    return res.status(401).json({
      success: false,
      error:
        'User authentication required. Provide Bearer token or x-user-id header.',
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  extractUserId,
};
