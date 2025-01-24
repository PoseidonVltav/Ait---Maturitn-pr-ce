/*
  # Fix admin permissions for deleting reviews

  1. Changes
    - Drop all existing review policies
    - Create new simplified policies
    - Ensure admins can delete any review
    - Users can still delete their own reviews

  2. Security
    - Maintain RLS
    - Proper admin checks
    - User permissions intact
*/

-- Drop all existing review policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view reviews" ON business_reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON business_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON business_reviews;
DROP POLICY IF EXISTS "Review deletion policy" ON business_reviews;
DROP POLICY IF EXISTS "Anyone can view reviews" ON business_reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON business_reviews;
DROP POLICY IF EXISTS "Users can manage their own reviews" ON business_reviews;
DROP POLICY IF EXISTS "Users and admins can delete reviews" ON business_reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON business_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON business_reviews;
DROP POLICY IF EXISTS "Admins can delete any review" ON business_reviews;

-- Create new simplified policies
CREATE POLICY "Public can view reviews"
    ON business_reviews
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Users can create reviews"
    ON business_reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND business_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM business_profiles
            WHERE id = business_id
            AND status = 'active'
        )
    );

CREATE POLICY "Users can update own reviews"
    ON business_reviews
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin or owner can delete reviews"
    ON business_reviews
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM user_metadata
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );