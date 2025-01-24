/*
  # Add business timeout functionality and fix admin access

  1. Changes
    - Add timeout status to business_profiles
    - Add admin policies for managing timeouts
    - Add admin policies for managing reviews
*/

-- Add timeout fields to business_profiles
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS is_timeout boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS timeout_until timestamptz,
ADD COLUMN IF NOT EXISTS timeout_by uuid REFERENCES auth.users(id);

-- Add admin policies for business_profiles
CREATE POLICY "Admins can manage all businesses"
    ON business_profiles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_metadata
            WHERE user_metadata.id = auth.uid()
            AND user_metadata.is_admin = true
        )
    );

-- Add admin policies for business_reviews
CREATE POLICY "Admins can manage all reviews"
    ON business_reviews
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_metadata
            WHERE user_metadata.id = auth.uid()
            AND user_metadata.is_admin = true
        )
    );

-- Update business_profiles policies to respect timeout
DROP POLICY IF EXISTS "Public can view active business profiles" ON business_profiles;
CREATE POLICY "Public can view active non-timeout business profiles"
    ON business_profiles
    FOR SELECT
    TO public
    USING (
        status = 'active' 
        AND (
            NOT is_timeout 
            OR timeout_until < now() 
            OR auth.uid() IN (
                SELECT user_id FROM businesses WHERE id = business_id
            )
            OR EXISTS (
                SELECT 1 FROM user_metadata
                WHERE user_metadata.id = auth.uid()
                AND user_metadata.is_admin = true
            )
        )
    );