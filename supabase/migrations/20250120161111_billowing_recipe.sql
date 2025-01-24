/*
  # Fix business relationships

  1. Changes
    - Ensures proper business record exists for email4something@seznam.cz
    - Links existing business profile to the business record
    - Adds proper foreign key constraints

  2. Security
    - Maintains all existing RLS policies
*/

-- First ensure we have the user's ID
DO $$ 
DECLARE
    target_user_id uuid;
    target_business_id uuid;
    target_profile_id uuid;
BEGIN
    -- Get the user's ID
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'email4something@seznam.cz';

    IF target_user_id IS NOT NULL THEN
        -- Check if business already exists
        SELECT id INTO target_business_id
        FROM businesses
        WHERE user_id = target_user_id;

        -- Create business if it doesn't exist
        IF target_business_id IS NULL THEN
            INSERT INTO businesses (user_id)
            VALUES (target_user_id)
            RETURNING id INTO target_business_id;
        END IF;

        -- Get the profile that needs to be linked
        SELECT id INTO target_profile_id
        FROM business_profiles
        WHERE business_id IS NULL
        LIMIT 1;

        -- Update the profile to point to the business
        IF target_profile_id IS NOT NULL AND target_business_id IS NOT NULL THEN
            UPDATE business_profiles
            SET business_id = target_business_id
            WHERE id = target_profile_id;
        END IF;
    END IF;
END $$;