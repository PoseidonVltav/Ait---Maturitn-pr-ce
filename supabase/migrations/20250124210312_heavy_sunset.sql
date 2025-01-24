-- Fix business relationships and ensure correct data structure
DO $$ 
DECLARE
    business_user RECORD;
    business_id uuid;
    profile_id uuid;
BEGIN
    -- Loop through all business users with explicit column references
    FOR business_user IN 
        SELECT DISTINCT u.id AS user_id, u.email 
        FROM auth.users u
        JOIN user_metadata um ON u.id = um.id
        WHERE um.user_type = 'business'
    LOOP
        -- Check if user has a business
        SELECT b.id INTO business_id
        FROM businesses b
        WHERE b.user_id = business_user.user_id
        ORDER BY b.created_at DESC
        LIMIT 1;

        -- Create business if doesn't exist
        IF business_id IS NULL THEN
            INSERT INTO businesses (user_id)
            VALUES (business_user.user_id)
            RETURNING id INTO business_id;
        END IF;

        -- Check if business has a profile
        SELECT bp.id INTO profile_id
        FROM business_profiles bp
        WHERE bp.business_id = business_id;

        -- Create profile if doesn't exist
        IF profile_id IS NULL THEN
            INSERT INTO business_profiles (
                business_id,
                name,
                status
            ) VALUES (
                business_id,
                'Nový podnik',
                'active'
            );
        END IF;
    END LOOP;

    -- Clean up orphaned profiles
    DELETE FROM business_profiles bp
    WHERE bp.business_id NOT IN (
        SELECT b.id FROM businesses b
    );

    -- Clean up orphaned businesses
    DELETE FROM businesses b
    WHERE b.user_id NOT IN (
        SELECT u.id FROM auth.users u
    );

    -- Ensure all business users have correct metadata
    UPDATE user_metadata um
    SET user_type = 'business'
    WHERE um.id IN (
        SELECT b.user_id 
        FROM businesses b
    );

    -- Fix specific user if needed (email4something@seznam.cz)
    UPDATE user_metadata um
    SET user_type = 'business'
    WHERE um.email = 'email4something@seznam.cz';

    -- Ensure this user has a business and profile
    WITH specific_user AS (
        SELECT u.id AS user_id
        FROM auth.users u
        JOIN user_metadata um ON u.id = um.id
        WHERE um.email = 'email4something@seznam.cz'
    ),
    ensure_business AS (
        INSERT INTO businesses (user_id)
        SELECT su.user_id
        FROM specific_user su
        WHERE NOT EXISTS (
            SELECT 1 FROM businesses b
            WHERE b.user_id = su.user_id
        )
        RETURNING id AS business_id
    ),
    existing_business AS (
        SELECT b.id AS business_id
        FROM businesses b
        JOIN specific_user su ON b.user_id = su.user_id
    ),
    business_to_use AS (
        SELECT business_id FROM ensure_business
        UNION ALL
        SELECT business_id FROM existing_business
        LIMIT 1
    )
    INSERT INTO business_profiles (business_id, name, status)
    SELECT btu.business_id, 'Nový podnik', 'active'
    FROM business_to_use btu
    WHERE NOT EXISTS (
        SELECT 1 FROM business_profiles bp
        WHERE bp.business_id = btu.business_id
    );
END $$;

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_businesses_user_id 
ON businesses(user_id);

CREATE INDEX IF NOT EXISTS idx_business_profiles_business_id 
ON business_profiles(business_id);

-- Add constraint to ensure business_profiles always have a business
ALTER TABLE business_profiles
DROP CONSTRAINT IF EXISTS business_profiles_business_id_fkey,
ADD CONSTRAINT business_profiles_business_id_fkey 
    FOREIGN KEY (business_id) 
    REFERENCES businesses(id) 
    ON DELETE CASCADE;

-- Add constraint to ensure businesses always have a user
ALTER TABLE businesses
DROP CONSTRAINT IF EXISTS businesses_user_id_fkey,
ADD CONSTRAINT businesses_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;