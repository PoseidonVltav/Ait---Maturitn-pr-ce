/*
  # Fix review policies and metadata

  1. Changes
    - Add functions for user metadata access
    - Update review policies
    - Fix foreign key relationships

  2. Security
    - Enable RLS
    - Add proper policies
    - Use security definer functions
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_review_user_metadata(uuid);
DROP FUNCTION IF EXISTS get_user_metadata(uuid);

-- Create function to get user metadata for reviews
CREATE OR REPLACE FUNCTION get_review_user_metadata(review_id uuid)
RETURNS TABLE (
    email text,
    is_admin boolean
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        um.email,
        um.is_admin
    FROM business_reviews br
    JOIN user_metadata um ON br.user_id = um.id
    WHERE br.id = review_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user metadata directly
CREATE OR REPLACE FUNCTION get_user_metadata(user_id uuid)
RETURNS TABLE (
    email text,
    is_admin boolean
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        um.email,
        um.is_admin
    FROM user_metadata um
    WHERE um.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view reviews" ON business_reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON business_reviews;
DROP POLICY IF EXISTS "Users can manage their own reviews" ON business_reviews;

-- Create policies for business reviews
CREATE POLICY "Anyone can view reviews"
    ON business_reviews
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can create reviews"
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

CREATE POLICY "Users can manage their own reviews"
    ON business_reviews
    FOR ALL
    TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM user_metadata
            WHERE id = auth.uid()
            AND is_admin = true
        )
    )
    WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM user_metadata
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_reviews_user_business 
ON business_reviews(user_id, business_id);

CREATE INDEX IF NOT EXISTS idx_business_reviews_created 
ON business_reviews(created_at DESC);

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_review_user_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_metadata TO authenticated;