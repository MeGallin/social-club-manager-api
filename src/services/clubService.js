const supabase = require('../config/supabase');
const {
  CLUB_TYPES,
  AVAILABLE_MODULES,
  VALIDATION_RULES,
} = require('../models/Club');

/**
 * Club Service
 * Handles all club-related operations using Supabase
 */
class ClubService {
  constructor() {
    // Check if Supabase is configured
    if (!supabase) {
      console.warn(
        '⚠️  Supabase not configured. Club service will return mock data for development.',
      );
    } else {
      console.log('✅ ClubService initialized with Supabase client');
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
   * Validate club data
   * @param {Object} clubData - The club data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   * @returns {Object} Validation result
   */
  validateClubData(clubData, isUpdate = false) {
    const errors = [];

    // Name validation
    if (!isUpdate || clubData.name !== undefined) {
      if (!clubData.name && !isUpdate) {
        errors.push('Name is required');
      } else if (clubData.name) {
        if (clubData.name.length < VALIDATION_RULES.name.minLength) {
          errors.push(
            `Name must be at least ${VALIDATION_RULES.name.minLength} characters`,
          );
        }
        if (clubData.name.length > VALIDATION_RULES.name.maxLength) {
          errors.push(
            `Name must not exceed ${VALIDATION_RULES.name.maxLength} characters`,
          );
        }
      }
    }

    // Type validation
    if (!isUpdate || clubData.type !== undefined) {
      if (!clubData.type && !isUpdate) {
        errors.push('Type is required');
      } else if (
        clubData.type &&
        !Object.values(CLUB_TYPES).includes(clubData.type)
      ) {
        errors.push(
          `Type must be one of: ${Object.values(CLUB_TYPES).join(', ')}`,
        );
      }
    }

    // Description validation
    if (
      clubData.description &&
      clubData.description.length > VALIDATION_RULES.description.maxLength
    ) {
      errors.push(
        `Description must not exceed ${VALIDATION_RULES.description.maxLength} characters`,
      );
    }

    // Logo URL validation
    if (
      clubData.logo_url &&
      !VALIDATION_RULES.logo_url.pattern.test(clubData.logo_url)
    ) {
      errors.push(
        'Logo URL must be a valid image URL (jpg, jpeg, png, gif, svg, webp)',
      );
    }

    // Enabled modules validation
    if (clubData.enabled_modules) {
      if (!Array.isArray(clubData.enabled_modules)) {
        errors.push('Enabled modules must be an array');
      } else {
        const validModules = Object.values(AVAILABLE_MODULES);
        const invalidModules = clubData.enabled_modules.filter(
          (module) => !validModules.includes(module),
        );
        if (invalidModules.length > 0) {
          errors.push(
            `Invalid modules: ${invalidModules.join(', ')}. Valid modules: ${validModules.join(', ')}`,
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a new club
   * @param {Object} clubData - The club data
   * @param {string} creatorId - The ID of the user creating the club
   * @returns {Promise<Object>} The created club
   */
  async createClub(clubData, creatorId) {
    if (!this._isSupabaseAvailable()) {
      throw new Error(
        'Supabase is not configured. Cannot perform database operations.',
      );
    }

    // Validate input
    const validation = this.validateClubData(clubData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Prepare club data for insertion
    const clubToInsert = {
      name: clubData.name,
      type: clubData.type,
      description: clubData.description || null,
      logo_url: clubData.logo_url || null,
      creator_id: creatorId,
      enabled_modules: clubData.enabled_modules || null,
    };

    try {
      const { data, error } = await supabase
        .from('clubs')
        .insert([clubToInsert])
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation
        if (
          error.code === '23505' &&
          error.message.includes('unique_club_name_per_creator')
        ) {
          throw new Error('A club with this name already exists for this user');
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error.message.includes('A club with this name already exists')) {
        throw error;
      }
      throw new Error(`Failed to create club: ${error.message}`);
    }
  }

  /**
   * Get a club by ID
   * @param {string} clubId - The club ID
   * @returns {Promise<Object>} The club data
   */
  async getClubById(clubId) {
    if (!this._isSupabaseAvailable()) {
      throw new Error(
        'Supabase is not configured. Cannot perform database operations.',
      );
    }

    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Club not found
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to retrieve club: ${error.message}`);
    }
  }

  /**
   * Update a club
   * @param {string} clubId - The club ID
   * @param {Object} updates - The updates to apply
   * @param {string} userId - The ID of the user making the update
   * @returns {Promise<Object>} The updated club
   */
  async updateClub(clubId, updates, userId) {
    if (!this._isSupabaseAvailable()) {
      throw new Error(
        'Supabase is not configured. Cannot perform database operations.',
      );
    }

    // Validate updates
    const validation = this.validateClubData(updates, true);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // First, check if the club exists and if the user is the creator
    const existingClub = await this.getClubById(clubId);
    if (!existingClub) {
      throw new Error('Club not found');
    }

    if (existingClub.creator_id !== userId) {
      throw new Error('Only the club creator can update this club');
    }

    // Prepare updates (only include defined fields)
    const updateData = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.logo_url !== undefined) updateData.logo_url = updates.logo_url;
    if (updates.enabled_modules !== undefined)
      updateData.enabled_modules = updates.enabled_modules;

    try {
      const { data, error } = await supabase
        .from('clubs')
        .update(updateData)
        .eq('id', clubId)
        .eq('creator_id', userId) // Double-check creator permission
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation
        if (
          error.code === '23505' &&
          error.message.includes('unique_club_name_per_creator')
        ) {
          throw new Error('A club with this name already exists for this user');
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error.message.includes('A club with this name already exists')) {
        throw error;
      }
      throw new Error(`Failed to update club: ${error.message}`);
    }
  }

  /**
   * Delete a club
   * @param {string} clubId - The club ID
   * @param {string} userId - The ID of the user making the deletion
   * @returns {Promise<boolean>} Success status
   */
  async deleteClub(clubId, userId) {
    if (!this._isSupabaseAvailable()) {
      throw new Error(
        'Supabase is not configured. Cannot perform database operations.',
      );
    }

    // First, check if the club exists and if the user is the creator
    const existingClub = await this.getClubById(clubId);
    if (!existingClub) {
      throw new Error('Club not found');
    }

    if (existingClub.creator_id !== userId) {
      throw new Error('Only the club creator can delete this club');
    }

    try {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', clubId)
        .eq('creator_id', userId); // Double-check creator permission

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete club: ${error.message}`);
    }
  }

  /**
   * Get clubs by creator
   * @param {string} creatorId - The creator's user ID
   * @returns {Promise<Array>} List of clubs
   */
  async getClubsByCreator(creatorId) {
    if (!this._isSupabaseAvailable()) {
      throw new Error(
        'Supabase is not configured. Cannot perform database operations.',
      );
    }

    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Failed to retrieve clubs: ${error.message}`);
    }
  }
}

module.exports = new ClubService();
