/*
  # Fix remaining issues

  1. Changes
    - Fix business profile queries
    - Fix review relationships
    - Update timeout visibility
    - Fix admin review rate limit
*/

-- Drop existing policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public can view active non-timeout business profiles" ON business_profiles;
    DROP POLICY IF EXISTS "Business owners can manage their own businesses" ON business_profiles;
END $$;

-- Fix business_reviews foreign key relationships
ALTER TABLE business_reviews
DROP CONSTRAINT IF EXISTS business_reviews_user_id_fkey,
ADD CONSTRAINT business_reviews_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Fix business profile policies
CREATE POLICY "Public can view active non-timeout business profiles"
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

CREATE POLICY "Business owners can manage their own businesses"
    ON business_profiles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM businesses 
            WHERE businesses.id = business_id 
            AND businesses.user_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM user_metadata
                WHERE user_metadata.id = auth.uid()
                AND user_metadata.user_type = 'business'
            )
        )
    );