-- Add timeout columns to business_profiles table
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS is_timeout boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS timeout_until timestamptz,
ADD COLUMN IF NOT EXISTS timeout_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS timeout_reason text;

-- Create index for timeout queries
CREATE INDEX IF NOT EXISTS idx_business_profiles_timeout 
ON business_profiles(is_timeout, timeout_until);

-- Update policies to handle timeout
DROP POLICY IF EXISTS "Public can view non-timeout business profiles" ON business_profiles;

CREATE POLICY "Public can view non-timeout business profiles"
    ON business_profiles
    FOR SELECT
    TO public
    USING (
        status = 'active'
        AND (
            NOT is_timeout 
            OR timeout_until < now() 
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