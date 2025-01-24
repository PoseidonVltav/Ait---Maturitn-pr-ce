/*
  # Fix reviews and user metadata relationships

  1. Changes
    - Add proper foreign key relationships
    - Update review queries
    - Fix user metadata access

  2. Security
    - Enable RLS
    - Add proper policies
*/

-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can view reviews" ON business_reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON business_reviews;
DROP POLICY IF EXISTS "Users can manage their own reviews" ON business_reviews;

-- Fix foreign key relationships
ALTER TABLE business_reviews
DROP CONSTRAINT IF EXISTS business_reviews_user_id_fkey,
ADD CONSTRAINT business_reviews_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Create function to get user metadata
CREATE OR REPLACE FUNCTION get_review_user_metadata(review_id uuid)
RETURNS TABLE (
    email text,
    is_admin boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        um.email,
        um.is_admin
    FROM business_reviews br
    JOIN user_metadata um ON br.user_id = um.id
    WHERE br.id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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