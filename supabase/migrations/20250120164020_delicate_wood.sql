-- Fix business relationships for email4something@seznam.cz
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
        -- Ensure user is marked as business type
        UPDATE user_metadata
        SET user_type = 'business'
        WHERE id = target_user_id;

        -- Get or create business
        SELECT id INTO target_business_id
        FROM businesses
        WHERE user_id = target_user_id
        ORDER BY created_at DESC
        LIMIT 1;

        IF target_business_id IS NULL THEN
            INSERT INTO businesses (user_id)
            VALUES (target_user_id)
            RETURNING id INTO target_business_id;
        END IF;

        -- Get existing profile
        SELECT id INTO target_profile_id
        FROM business_profiles
        WHERE business_id = target_business_id;

        -- Create profile if it doesn't exist
        IF target_profile_id IS NULL THEN
            INSERT INTO business_profiles (
                business_id,
                name,
                status
            ) VALUES (
                target_business_id,
                'Sezam',
                'active'
            );
        END IF;
    END IF;
END $$;