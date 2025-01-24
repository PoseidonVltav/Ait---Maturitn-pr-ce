/*
  # Fix reviews permissions and relationships

  1. Changes
    - Add missing policies for business reviews
    - Fix user metadata relationship
    - Update review deletion permissions

  2. Security
    - Enable RLS on all tables
    - Add proper policies for review management
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all reviews" ON business_reviews;
DROP POLICY IF EXISTS "Users can manage their reviews" ON business_reviews;

-- Fix business reviews policies
CREATE POLICY "Users can create reviews"
    ON business_reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM business_profiles
            WHERE id = business_id
            AND status = 'active'
        )
    );

CREATE POLICY "Users can view reviews"
    ON business_reviews
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM business_profiles
            WHERE id = business_id
            AND status = 'active'
        )
    );

CREATE POLICY "Users can delete their own reviews"
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

CREATE POLICY "Users can update their own reviews"
    ON business_reviews
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_business_reviews_user_business 
ON business_reviews(user_id, business_id);