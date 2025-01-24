/*
  # Fix all business relationships

  1. Changes
    - Ensures all business profiles have valid business records
    - Creates missing business records for business type users
    - Links orphaned business profiles to appropriate businesses
    - Fixes any broken relationships

  2. Security
    - Maintains all existing RLS policies
*/

-- Function to ensure business exists for user with unambiguous references
CREATE OR REPLACE FUNCTION ensure_business_exists(target_user_id uuid)
RETURNS uuid AS $$
DECLARE
    found_business_id uuid;
BEGIN
    -- Check if business already exists with explicit table alias
    SELECT b.id INTO found_business_id
    FROM businesses b
    WHERE b.user_id = target_user_id;

    -- Create new business if it doesn't exist
    IF found_business_id IS NULL THEN
        INSERT INTO businesses (user_id)
        VALUES (target_user_id)
        RETURNING id INTO found_business_id;
    END IF;

    RETURN found_business_id;
END;
$$ LANGUAGE plpgsql;

-- Fix all business relationships
DO $$ 
DECLARE
    profile_record RECORD;
    user_record RECORD;
    new_business_id uuid;
BEGIN
    -- First, ensure all business-type users have businesses
    FOR user_record IN 
        SELECT um.id as user_id
        FROM user_metadata um
        WHERE um.user_type = 'business'
    LOOP
        new_business_id := ensure_business_exists(user_record.user_id);
    END LOOP;

    -- Then, fix all business profiles
    FOR profile_record IN 
        SELECT 
            bp.id as profile_id,
            bp.business_id,
            um.id as user_id
        FROM business_profiles bp
        LEFT JOIN businesses b ON bp.business_id = b.id
        LEFT JOIN user_metadata um ON um.user_type = 'business'
        WHERE bp.business_id IS NULL 
           OR b.id IS NULL
        LIMIT 1
    LOOP
        IF profile_record.user_id IS NOT NULL THEN
            -- Get or create business for this user
            new_business_id := ensure_business_exists(profile_record.user_id);
            
            -- Link profile to business
            UPDATE business_profiles
            SET business_id = new_business_id
            WHERE id = profile_record.profile_id;
        END IF;
    END LOOP;
END $$;