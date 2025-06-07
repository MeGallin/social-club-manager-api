const supabase = require('../config/supabase');

/**
 * Onboarding Service
 * Handles modular onboarding checklist operations and status tracking
 */
class OnboardingService {
  constructor() {
    // Initialize default onboarding steps configuration
    this.defaultSteps = {
      created_club: {
        id: 'created_club',
        label: 'Create Your Club',
        description: 'Set up your club with basic information',
        required: true,
        weight: 1,
      },
      enabled_modules: {
        id: 'enabled_modules',
        label: 'Enable Features',
        description: 'Choose which features your club will use',
        required: true,
        weight: 1,
      },
      invited_member: {
        id: 'invited_member',
        label: 'Invite Members',
        description: 'Send invitations to your first members',
        required: false,
        weight: 1,
      },
      created_event: {
        id: 'created_event',
        label: 'Create First Event',
        description: "Schedule your club's first event",
        required: false,
        weight: 1,
      },
    };

    if (!supabase) {
      console.warn(
        '⚠️  Supabase not configured. OnboardingService will return mock data.',
      );
    } else {
      console.log('✅ OnboardingService initialized with Supabase client');
    }
  }

  /**
   * Get onboarding status for a club
   * @param {string} clubId - The club ID
   * @returns {Promise<Object>} Onboarding status with progress metrics
   */
  async getOnboardingStatus(clubId) {
    if (!supabase) {
      return this._getMockOnboardingStatus();
    }

    try {
      const { data: club, error } = await supabase
        .from('clubs')
        .select('onboarding_status, enabled_modules')
        .eq('id', clubId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch onboarding status: ${error.message}`);
      }

      if (!club) {
        throw new Error('Club not found');
      }

      // Ensure onboarding_status exists and has default structure
      const status = club.onboarding_status || {};

      // Calculate progress metrics
      const enrichedStatus = this._enrichOnboardingStatus(
        status,
        club.enabled_modules,
      );

      return enrichedStatus;
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
      throw error;
    }
  }

  /**
   * Update onboarding status for a club
   * @param {string} clubId - The club ID
   * @param {string} step - The step to update
   * @param {any} value - The value to set for the step
   * @returns {Promise<Object>} Updated onboarding status
   */
  async updateOnboardingStep(clubId, step, value) {
    if (!supabase) {
      return this._getMockOnboardingStatus();
    }

    try {
      // Validate step exists
      if (!this.defaultSteps[step]) {
        throw new Error(`Invalid onboarding step: ${step}`);
      }

      // Get current status
      const currentStatus = await this.getOnboardingStatus(clubId);

      // Update the specific step
      const updatedStatus = { ...currentStatus };
      updatedStatus[step] = value;

      // Recalculate progress metrics
      const enrichedStatus = this._enrichOnboardingStatus(updatedStatus);

      // Update in database
      const { error } = await supabase
        .from('clubs')
        .update({ onboarding_status: enrichedStatus })
        .eq('id', clubId);

      if (error) {
        throw new Error(`Failed to update onboarding status: ${error.message}`);
      }

      return enrichedStatus;
    } catch (error) {
      console.error('Error updating onboarding step:', error);
      throw error;
    }
  }

  /**
   * Auto-update onboarding status based on club actions
   * @param {string} clubId - The club ID
   * @param {string} action - The action that was performed
   * @param {any} actionData - Additional data about the action
   * @returns {Promise<Object>} Updated onboarding status
   */
  async autoUpdateOnboardingStatus(clubId, action, actionData = null) {
    if (!supabase) {
      return this._getMockOnboardingStatus();
    }

    try {
      const updates = {};

      switch (action) {
        case 'club_created':
          updates.created_club = true;
          if (actionData?.enabled_modules) {
            updates.enabled_modules = actionData.enabled_modules;
          }
          break;
        case 'modules_enabled':
          updates.enabled_modules = actionData;
          break;
        case 'member_invited':
          updates.invited_member = true;
          break;
        case 'event_created':
          updates.created_event = true;
          break;
        default:
          console.warn(`Unknown onboarding action: ${action}`);
          return null;
      }

      // Get current status and merge updates
      const currentStatus = await this.getOnboardingStatus(clubId);
      const mergedStatus = { ...currentStatus, ...updates };

      // Recalculate progress metrics
      const enrichedStatus = this._enrichOnboardingStatus(mergedStatus);

      // Update in database
      const { error } = await supabase
        .from('clubs')
        .update({ onboarding_status: enrichedStatus })
        .eq('id', clubId);

      if (error) {
        throw new Error(
          `Failed to auto-update onboarding status: ${error.message}`,
        );
      }

      return enrichedStatus;
    } catch (error) {
      console.error('Error auto-updating onboarding status:', error);
      throw error;
    }
  }

  /**
   * Initialize onboarding status for a new club
   * @param {string} clubId - The club ID
   * @param {Array} enabledModules - Initially enabled modules
   * @returns {Promise<Object>} Initial onboarding status
   */
  async initializeOnboardingStatus(clubId, enabledModules = []) {
    const initialStatus = {
      created_club: true,
      enabled_modules: enabledModules,
      invited_member: false,
      created_event: false,
    };

    const enrichedStatus = this._enrichOnboardingStatus(initialStatus);

    if (!supabase) {
      return enrichedStatus;
    }

    try {
      const { error } = await supabase
        .from('clubs')
        .update({ onboarding_status: enrichedStatus })
        .eq('id', clubId);

      if (error) {
        throw new Error(
          `Failed to initialize onboarding status: ${error.message}`,
        );
      }

      return enrichedStatus;
    } catch (error) {
      console.error('Error initializing onboarding status:', error);
      throw error;
    }
  }

  /**
   * Get available onboarding steps configuration
   * @returns {Object} Available steps with metadata
   */
  getAvailableSteps() {
    return { ...this.defaultSteps };
  }

  /**
   * Enrich onboarding status with progress metrics and metadata
   * @param {Object} status - Current onboarding status
   * @param {Array} enabledModules - Currently enabled modules
   * @returns {Object} Enriched status with progress metrics
   */
  _enrichOnboardingStatus(status, enabledModules = null) {
    const enriched = { ...status };

    // Ensure enabled_modules is properly set
    if (enabledModules && !enriched.enabled_modules) {
      enriched.enabled_modules = enabledModules;
    } else if (!enriched.enabled_modules) {
      enriched.enabled_modules = [];
    }

    // Calculate completion metrics
    const steps = Object.keys(this.defaultSteps);
    let completedSteps = 0;
    let totalWeight = 0;
    let completedWeight = 0;

    steps.forEach((stepId) => {
      const stepConfig = this.defaultSteps[stepId];
      const isCompleted = this._isStepCompleted(stepId, enriched);

      totalWeight += stepConfig.weight;
      if (isCompleted) {
        completedSteps++;
        completedWeight += stepConfig.weight;
      }
    });

    // Add progress metadata
    enriched.completed_steps = completedSteps;
    enriched.total_steps = steps.length;
    enriched.completion_percentage = Math.round(
      (completedWeight / totalWeight) * 100,
    );
    enriched.is_complete = completedSteps === steps.length;

    // Add next steps recommendations
    enriched.next_steps = this._getNextSteps(enriched);

    return enriched;
  }

  /**
   * Check if a specific onboarding step is completed
   * @param {string} stepId - The step ID to check
   * @param {Object} status - Current onboarding status
   * @returns {boolean} Whether the step is completed
   */
  _isStepCompleted(stepId, status) {
    switch (stepId) {
      case 'created_club':
        return !!status.created_club;
      case 'enabled_modules':
        return (
          Array.isArray(status.enabled_modules) &&
          status.enabled_modules.length > 0
        );
      case 'invited_member':
        return !!status.invited_member;
      case 'created_event':
        return !!status.created_event;
      default:
        return false;
    }
  }

  /**
   * Get recommended next steps for onboarding
   * @param {Object} status - Current onboarding status
   * @returns {Array} Array of recommended next steps
   */
  _getNextSteps(status) {
    const nextSteps = [];

    Object.keys(this.defaultSteps).forEach((stepId) => {
      if (!this._isStepCompleted(stepId, status)) {
        const stepConfig = this.defaultSteps[stepId];
        nextSteps.push({
          id: stepId,
          label: stepConfig.label,
          description: stepConfig.description,
          required: stepConfig.required,
        });
      }
    });

    return nextSteps;
  }

  /**
   * Mock onboarding status for development
   * @returns {Object} Mock onboarding status
   */
  _getMockOnboardingStatus() {
    return {
      created_club: true,
      enabled_modules: ['events', 'member_management'],
      invited_member: false,
      created_event: false,
      completed_steps: 2,
      total_steps: 4,
      completion_percentage: 50,
      is_complete: false,
      next_steps: [
        {
          id: 'invited_member',
          label: 'Invite Members',
          description: 'Send invitations to your first members',
          required: false,
        },
        {
          id: 'created_event',
          label: 'Create First Event',
          description: "Schedule your club's first event",
          required: false,
        },
      ],
    };
  }
}

module.exports = new OnboardingService();
