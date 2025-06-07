-- BE-12 Onboarding Status Schema Extension
-- Adds onboarding_status JSONB field to public.clubs table to track onboarding progress

-- Add onboarding_status column to clubs table
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS onboarding_status JSONB DEFAULT '{}';

-- Create index for onboarding_status queries
CREATE INDEX IF NOT EXISTS idx_clubs_onboarding_status 
ON public.clubs USING GIN (onboarding_status);

-- Update existing clubs to have initial onboarding status
-- This sets up the basic structure for existing clubs
UPDATE public.clubs 
SET onboarding_status = jsonb_build_object(
    'created_club', true,
    'enabled_modules', COALESCE(enabled_modules, '[]'::jsonb),
    'invited_member', false,
    'created_event', false,
    'completed_steps', 1,
    'total_steps', 4,
    'completion_percentage', 25
)
WHERE onboarding_status = '{}' OR onboarding_status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.clubs.onboarding_status IS 'JSONB object tracking onboarding progress with steps like created_club, enabled_modules, invited_member, created_event';
