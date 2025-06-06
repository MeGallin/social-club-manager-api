/**
 * Club Model
 *
 * Represents the club entity and its structure in the Supabase database.
 * This model defines the schema for the public.clubs table.
 *
 * @file Club.js
 * @version 1.0.0
 * @author Social Club Manager API
 */

/**
 * Club entity structure
 * @typedef {Object} Club
 * @property {string} id - UUID primary key
 * @property {string} name - Club name (required, unique per creator)
 * @property {string} type - Club type/category (e.g., sports, scouts, hobby)
 * @property {string|null} description - Optional club description
 * @property {string|null} logo_url - Optional URL to club logo
 * @property {string|null} creator_id - UUID reference to auth.users.id
 * @property {Object|null} enabled_modules - JSON array of enabled feature modules
 * @property {string} created_at - ISO timestamp of creation
 */

/**
 * Club types enumeration
 * Common club categories for validation
 */
const CLUB_TYPES = {
  SPORTS: 'sports',
  SCOUTS: 'scouts',
  HOBBY: 'hobby',
  EDUCATIONAL: 'educational',
  SOCIAL: 'social',
  VOLUNTEER: 'volunteer',
  PROFESSIONAL: 'professional',
  OTHER: 'other',
};

/**
 * Available modules that can be enabled for clubs
 */
const AVAILABLE_MODULES = {
  EVENTS: 'events',
  INVENTORY: 'inventory',
  PAYMENTS: 'payments',
  COMMUNICATIONS: 'communications',
  MEMBER_MANAGEMENT: 'member_management',
  REPORTS: 'reports',
  DOCUMENTS: 'documents',
};

/**
 * Club validation rules
 */
const VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  type: {
    required: true,
    enum: Object.values(CLUB_TYPES),
  },
  description: {
    required: false,
    maxLength: 500,
  },
  logo_url: {
    required: false,
    pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp)$/i,
  },
};

/**
 * Database table configuration
 */
const TABLE_CONFIG = {
  tableName: 'clubs',
  schema: 'public',
  primaryKey: 'id',
  foreignKeys: {
    creator_id: {
      table: 'auth.users',
      column: 'id',
      onDelete: 'SET NULL',
    },
  },
  indexes: [
    'unique_club_name_per_creator',
    'idx_clubs_creator_id',
    'idx_clubs_type',
  ],
  rlsEnabled: true,
};

/**
 * RLS Policies summary
 */
const RLS_POLICIES = {
  select: 'Clubs are publicly readable by authenticated users',
  insert: 'Users can create clubs',
  update: 'Club creators can update their own clubs',
  delete: 'Club creators can delete their own clubs',
};

module.exports = {
  CLUB_TYPES,
  AVAILABLE_MODULES,
  VALIDATION_RULES,
  TABLE_CONFIG,
  RLS_POLICIES,
};
