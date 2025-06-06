const supabase = require('../config/supabase');

// Mock data for when Supabase is not configured
const mockProfiles = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    full_name: 'John Doe',
    avatar_url: 'https://example.com/avatar1.png',
    created_at: '2024-01-15T10:30:00.000Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    full_name: 'Jane Smith',
    avatar_url: 'https://example.com/avatar2.png',
    created_at: '2024-01-15T11:30:00.000Z',
  },
];

/**
 * Profile Service
 * Handles all profile-related operations using Supabase
 */
class ProfileService {
  constructor() {
    // Check if Supabase is configured
    if (!supabase) {
      console.warn(
        '⚠️  Supabase not configured. Profile service will return mock data for development.',
      );
    } else {
      console.log('✅ ProfileService initialized with Supabase client');
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
   * Get mock profile data for development
   * @param {string} userId - The user's UUID
   * @returns {Object} Mock profile data
   */
  _getMockProfile(userId) {
    return {
      id: userId,
      full_name: 'Mock User',
      avatar_url: 'https://example.com/mock-avatar.png',
      created_at: new Date().toISOString(),
    };
  } /**
   * Get user profile by ID
   * @param {string} userId - The user's UUID
   * @returns {Promise<Object>} Profile data
   */
  async getProfile(userId) {
    try {
      // Return mock data if Supabase is not configured
      if (!this._isSupabaseAvailable()) {
        return this._getMockProfile(userId);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch profile: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Profile service error: ${error.message}`);
    }
  }
  /**
   * Get all profiles (admin only - requires service role)
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Array of profiles
   */
  async getAllProfiles(filters = {}) {
    try {
      // Return mock data if Supabase is not configured
      if (!this._isSupabaseAvailable()) {
        return [
          this._getMockProfile('550e8400-e29b-41d4-a716-446655440001'),
          this._getMockProfile('550e8400-e29b-41d4-a716-446655440002'),
        ];
      }

      let query = supabase.from('profiles').select('*');

      // Apply filters if provided
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit || 10) - 1,
        );
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch profiles: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Profile service error: ${error.message}`);
    }
  }
  /**
   * Update user profile
   * @param {string} userId - The user's UUID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile data
   */
  async updateProfile(userId, profileData) {
    try {
      // Return mock updated data if Supabase is not configured
      if (!this._isSupabaseAvailable()) {
        const mockProfile = this._getMockProfile(userId);
        return { ...mockProfile, ...profileData };
      }

      // Filter out non-updatable fields
      const allowedFields = ['full_name', 'avatar_url'];
      const updateData = {};

      for (const field of allowedFields) {
        if (profileData.hasOwnProperty(field)) {
          updateData[field] = profileData[field];
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Profile service error: ${error.message}`);
    }
  }

  /**
   * Create a new profile (manual creation - usually handled by trigger)
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>} Created profile data
   */
  async createProfile(profileData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create profile: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Profile service error: ${error.message}`);
    }
  }

  /**
   * Delete a profile
   * @param {string} userId - The user's UUID
   * @returns {Promise<boolean>} Success status
   */
  async deleteProfile(userId) {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to delete profile: ${error.message}`);
      }

      return true;
    } catch (error) {
      throw new Error(`Profile service error: ${error.message}`);
    }
  }

  /**
   * Check if profile exists
   * @param {string} userId - The user's UUID
   * @returns {Promise<boolean>} True if profile exists
   */
  async profileExists(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = No rows returned
        throw new Error(`Failed to check profile existence: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      throw new Error(`Profile service error: ${error.message}`);
    }
  }

  /**
   * Update user's consent status
   * @param {string} userId - The user's UUID
   * @param {boolean} consent - New consent status
   * @returns {Promise<Object>} Updated profile data
   */
  async updateConsent(userId, consent) {
    try {
      // Return mock data if Supabase is not configured
      if (!this._isSupabaseAvailable()) {
        const mockProfile = this._getMockProfile(userId);
        mockProfile.consent = consent;
        mockProfile.consent_date = consent ? new Date().toISOString() : null;
        return mockProfile;
      }

      const updateData = {
        consent: consent,
        consent_date: consent ? new Date().toISOString() : null,
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update consent: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Profile service error: ${error.message}`);
    }
  }
}

module.exports = new ProfileService();
