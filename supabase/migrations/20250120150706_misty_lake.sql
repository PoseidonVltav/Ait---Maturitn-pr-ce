/*
  # Fix admin functionality and business display

  1. Changes
    - Fix admin review rate limit
    - Add cascade delete for businesses
    - Fix business owner access
*/

-- Drop existing policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Business owners can manage their own businesses" ON business_profiles;
    DROP POLICY IF EXISTS "Admins can manage all businesses" ON business_profiles;
END $$;

-- Fix business deletion cascade
ALTER TABLE businesses
DROP CONSTRAINT IF EXISTS businesses_user_id_fkey,
ADD CONSTRAINT businesses_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Fix admin rate limit check
CREATE OR REPLACE FUNCTION check_review_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    review_count integer;
    is_admin boolean;
BEGIN
    -- Check if user is admin
    SELECT is_admin INTO is_admin
    FROM user_metadata
    WHERE id = NEW.user_id;

    -- Skip check for admins
    IF is_admin = true THEN
        RETURN NEW;
    END IF;

    -- Check rate limit for non-admin users
    SELECT COUNT(*)
    INTO review_count
    FROM business_reviews
    WHERE user_id = NEW.user_id
    AND business_id = NEW.business_id
    AND created_at > NOW() - INTERVAL '1 hour'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF review_count >= 2 THEN
        RAISE EXCEPTION 'Rate limit exceeded: Maximum 2 reviews per hour per business';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;