-- FIX FOR GENERATE_INVITE_CODE FUNCTION
-- Apply this to fix the base64url encoding issue

-- Replace the function with a working base64 implementation
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
BEGIN
    -- Use base64 encoding (which is supported) and make it URL-safe
    RETURN REPLACE(REPLACE(encode(gen_random_bytes(16), 'base64'), '+', '-'), '/', '_');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
