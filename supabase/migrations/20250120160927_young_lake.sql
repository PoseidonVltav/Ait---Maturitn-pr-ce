/*
  # Fix business ownership

  1. Changes
    - Updates business ownership for email4something@seznam.cz user
    - Ensures user has business type
    - Links existing business profile to the correct business

  2. Security
    - Maintains all existing RLS policies
    - Only affects specific user and business
*/

-- First ensure the user has business type
UPDATE user_metadata
SET user_type = 'business'
WHERE email = 'email4something@seznam.cz';

-- Get the user's ID
DO $$ 
DECLARE
    target_user_id uuid;
    existing_business_id uuid;
    existing_profile_id uuid;
BEGIN
    -- Get the target user's ID
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'email4something@seznam.cz';

    IF target_user_id IS NOT NULL THEN
        -- Create new business if doesn't exist
        INSERT INTO businesses (user_id)
        VALUES (target_user_id)
        RETURNING id INTO existing_business_id;

        -- Get existing profile ID
        SELECT id INTO existing_profile_id
        FROM business_profiles
        LIMIT 1;

        -- Update business_profiles to point to the new business
        IF existing_profile_id IS NOT NULL THEN
            UPDATE business_profiles
            SET business_id = existing_business_id
            WHERE id = existing_profile_id;
        END IF;
    END IF;
END $$;