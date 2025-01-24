-- First drop existing policies that might conflict
DROP POLICY IF EXISTS "Public can view non-timeout business profiles" ON business_profiles;
DROP POLICY IF EXISTS "Public can view active non-timeout business profiles" ON business_profiles;
DROP POLICY IF EXISTS "View business profiles with timeout check" ON business_profiles;
DROP POLICY IF EXISTS "Admin timeout management" ON business_profiles;
DROP POLICY IF EXISTS "Business profiles visibility" ON business_profiles;
DROP POLICY IF EXISTS "Admin timeout control" ON business_profiles;

-- Ensure we have the correct columns for timeout
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS is_timeout boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS timeout_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS timeout_reason text;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_business_profiles_timeout 
ON business_profiles(is_timeout);

-- Create new policy for viewing business profiles
CREATE POLICY "Business profile access"
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

-- Create policy for admins to manage timeouts
CREATE POLICY "Admin timeout management"
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