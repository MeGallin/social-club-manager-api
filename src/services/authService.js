const supabase = require('../config/supabase');

/**
 * Authentication Service
 * Handles all authentication operations using Supabase Auth
 */
class AuthService {
  constructor() {
    // Check if Supabase is configured
    if (!supabase) {
      console.warn(
        '⚠️  Supabase not configured. Auth service will return mock data for development.',
      );
    } else {
      console.log('✅ AuthService initialized with Supabase client');
    }
  }

  /**
   * Check if Supabase is available
   * @returns {boolean} True if Supabase is configured
   */
  _isSupabaseAvailable() {
    return !!supabase;
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.full_name - User full name
   * @param {string} userData.avatar_url - User avatar URL
   * @param {boolean} userData.consent - GDPR consent
   * @returns {Promise<Object>} User registration result
   */
  async registerUser(userData) {
    const { email, password, full_name, avatar_url, consent } = userData;

    // Validate required fields
    if (!email || !password || !consent) {
      throw new Error('Email, password, and GDPR consent are required');
    }

    if (!consent) {
      throw new Error('GDPR consent is required for registration');
    }

    // Return mock data if Supabase is not configured
    if (!this._isSupabaseAvailable()) {
      const mockUser = {
        id: `mock-${Date.now()}`,
        email,
        created_at: new Date().toISOString(),
      };

      const mockSession = {
        access_token: 'mock-jwt-token-for-development',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      };

      return {
        user: mockUser,
        session: mockSession,
      };
    }

    try {
      // Prepare user metadata for profile creation
      const userMetadata = {};
      if (full_name) userMetadata.full_name = full_name;
      if (avatar_url) userMetadata.avatar_url = avatar_url;
      userMetadata.consent = consent;
      userMetadata.consent_date = new Date().toISOString();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMetadata,
        },
      });

      if (error) {
        // Handle specific Supabase auth errors
        if (error.message.includes('User already registered')) {
          throw new Error('A user with this email already exists');
        }
        if (error.message.includes('Password should be at least')) {
          throw new Error(
            'Password is too weak. Please use a stronger password',
          );
        }
        throw new Error(error.message);
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
          user_metadata: data.user.user_metadata,
        },
        session: data.session,
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Login user with email and password
   * @param {Object} loginData - Login credentials
   * @param {string} loginData.email - User email
   * @param {string} loginData.password - User password
   * @returns {Promise<Object>} Login result
   */
  async loginUser(loginData) {
    const { email, password } = loginData;

    // Validate required fields
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Return mock data if Supabase is not configured
    if (!this._isSupabaseAvailable()) {
      // Mock user validation
      if (email === 'test@example.com' && password === 'TestPass123!') {
        const mockUser = {
          id: 'mock-user-id',
          email,
          created_at: new Date().toISOString(),
        };

        const mockSession = {
          access_token: 'mock-jwt-token-for-development',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
        };

        return {
          user: mockUser,
          session: mockSession,
        };
      } else {
        throw new Error('Invalid email or password');
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Handle specific Supabase auth errors
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email before logging in');
        }
        throw new Error(error.message);
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
          user_metadata: data.user.user_metadata,
        },
        session: data.session,
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logoutUser() {
    if (!this._isSupabaseAvailable()) {
      return { success: true, message: 'Logged out (mock)' };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  /**
   * Refresh user session
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New session data
   */
  async refreshSession(refreshToken) {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    if (!this._isSupabaseAvailable()) {
      return {
        session: {
          access_token: 'mock-refreshed-jwt-token',
          refresh_token: 'mock-new-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
        },
      };
    }

    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        session: data.session,
        user: data.user,
      };
    } catch (error) {
      throw new Error(`Session refresh failed: ${error.message}`);
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token to verify
   * @returns {Promise<Object>} Token verification result
   */
  async verifyToken(token) {
    if (!token) {
      throw new Error('Token is required');
    }

    if (!this._isSupabaseAvailable()) {
      return {
        valid: true,
        user: {
          id: 'mock-user-id',
          email: 'mock@example.com',
        },
      };
    }

    try {
      const { data, error } = await supabase.auth.getUser(token);

      if (error) {
        throw new Error(error.message);
      }

      return {
        valid: true,
        user: data.user,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }
}

module.exports = new AuthService();
