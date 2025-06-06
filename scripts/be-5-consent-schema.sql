-- ========================================================
-- BE-5: GDPR/Privacy Consent Handling Schema
-- ========================================================
-- This file contains SQL commands to add consent field to profiles table
-- and update the trigger function to handle consent data
--
-- Instructions:
-- 1. Open your Supabase dashboard
-- 2. Go to SQL Editor
-- 3. Copy and paste the commands below and execute them
-- ========================================================

-- ========================================================
-- 1. ADD CONSENT FIELD TO PROFILES TABLE
-- ========================================================
-- Add consent field to store GDPR consent status

ALTER TABLE public.profiles 
ADD COLUMN consent boolean DEFAULT false NOT NULL,
ADD COLUMN consent_date timestamp with time zone;

-- ========================================================
-- 2. UPDATE TRIGGER FUNCTION TO HANDLE CONSENT
-- ========================================================
-- Update the handle_new_user function to include consent data

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, consent, consent_date)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    COALESCE((new.raw_user_meta_data ->> 'consent')::boolean, false),
    CASE 
      WHEN (new.raw_user_meta_data ->> 'consent')::boolean = true 
      THEN (new.raw_user_meta_data ->> 'consent_date')::timestamp with time zone
      ELSE NULL
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================
-- 3. VERIFICATION QUERY
-- ========================================================
-- Run this to verify the consent field was added correctly

-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND table_schema = 'public'
-- ORDER BY ordinal_position;