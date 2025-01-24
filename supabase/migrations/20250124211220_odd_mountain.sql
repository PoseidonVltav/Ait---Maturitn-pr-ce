-- First drop the policy that depends on the timeout_until column
DROP POLICY IF EXISTS "Public can view non-timeout business profiles" ON business_profiles;

-- Now we can safely drop the column
ALTER TABLE business_profiles
DROP COLUMN IF EXISTS timeout_until;

-- Create new policy for viewing business profiles
CREATE POLICY "Public can view non-timeout business profiles"
    ON business_profiles
    FOR SELECT
    TO public
    USING (
        status = 'active'
        AND (
            NOT is_timeout
            OR EXISTS (
                SELECT 1 FROM businesses 
                WHERE businesses.id = business_id 
                AND businesses.user_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM user_metadata
                WHERE user_metadata.id = auth.uid()
                AND user_metadata.is_admin = true
            )
        )
    );

-- Add policy for admins to manage timeouts
DROP POLICY IF EXISTS "Admins can manage timeouts" ON business_profiles;

CREATE POLICY "Admins can manage timeouts"
    ON business_profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_metadata
            WHERE user_metadata.id = auth.uid()
            AND user_metadata.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_metadata
            WHERE user_metadata.id = auth.uid()
            AND user_metadata.is_admin = true
        )
    );