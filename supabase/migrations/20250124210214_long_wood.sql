-- Fix business relationships and ensure correct data structure
DO $$ 
DECLARE
    business_user RECORD;
    business_id uuid;
    profile_id uuid;
BEGIN
    -- Loop through all business users with explicit column references
    FOR business_user IN 
        SELECT u.id, u.email 
        FROM auth.users u
        JOIN user_metadata um ON u.id = um.id
        WHERE um.user_type = 'business'
    LOOP
        -- Check if user has a business
        SELECT b.id INTO business_id
        FROM businesses b
        WHERE b.user_id = business_user.id;

        -- Create business if doesn't exist
        IF business_id IS NULL THEN
            INSERT INTO businesses (user_id)
            VALUES (business_user.id)
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
END $$;

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_businesses_user_id 
ON businesses(user_id);

CREATE INDEX IF NOT EXISTS idx_business_profiles_business_id 
ON business_profiles(business_id);

-- Ensure all business users have correct metadata
UPDATE user_metadata um
SET user_type = 'business'
WHERE um.id IN (
    SELECT b.user_id 
    FROM businesses b
);

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