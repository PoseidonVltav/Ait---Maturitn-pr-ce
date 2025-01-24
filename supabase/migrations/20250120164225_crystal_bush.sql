-- First, let's identify and fix the Sezam business situation
DO $$ 
DECLARE
    target_user_id uuid;
    target_business_id uuid;
    target_profile_id uuid;
    duplicate_business_ids uuid[];
    duplicate_profile_ids uuid[];
BEGIN
    -- Get the user's ID for email4something@seznam.cz
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = 'email4something@seznam.cz';

    IF target_user_id IS NOT NULL THEN
        -- Ensure user is marked as business type
        UPDATE user_metadata
        SET user_type = 'business'
        WHERE id = target_user_id;

        -- Find all businesses owned by this user
        SELECT array_agg(id) INTO duplicate_business_ids
        FROM businesses
        WHERE user_id = target_user_id;

        -- Keep only the most recent business
        SELECT id INTO target_business_id
        FROM businesses
        WHERE user_id = target_user_id
        ORDER BY created_at DESC
        LIMIT 1;

        -- Find all profiles for these businesses
        SELECT array_agg(id) INTO duplicate_profile_ids
        FROM business_profiles
        WHERE business_id = ANY(duplicate_business_ids);

        -- Keep only the most complete profile
        SELECT id INTO target_profile_id
        FROM business_profiles
        WHERE business_id = ANY(duplicate_business_ids)
        ORDER BY 
            CASE 
                WHEN name IS NOT NULL AND description IS NOT NULL THEN 1
                WHEN name IS NOT NULL THEN 2
                ELSE 3
            END,
            created_at DESC
        LIMIT 1;

        -- If no profile exists, create one
        IF target_profile_id IS NULL THEN
            INSERT INTO business_profiles (
                business_id,
                name,
                status
            ) VALUES (
                target_business_id,
                'Sezam',
                'active'
            )
            RETURNING id INTO target_profile_id;
        ELSE
            -- Update the existing profile to point to the correct business
            UPDATE business_profiles
            SET 
                business_id = target_business_id,
                name = COALESCE(name, 'Sezam'),
                status = 'active'
            WHERE id = target_profile_id;
        END IF;

        -- Delete duplicate profiles except the target one
        DELETE FROM business_profiles
        WHERE id != target_profile_id
        AND business_id = ANY(duplicate_business_ids);

        -- Delete duplicate businesses except the target one
        DELETE FROM businesses
        WHERE id != target_business_id
        AND user_id = target_user_id;

        -- Ensure the profile has required fields
        UPDATE business_profiles
        SET 
            name = COALESCE(name, 'Sezam'),
            status = COALESCE(status, 'active')
        WHERE id = target_profile_id;
    END IF;
END $$;