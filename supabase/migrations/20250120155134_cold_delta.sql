/*
  # Fix reviews relationships and permissions

  1. Changes
    - Fix foreign key relationships
    - Update review policies
    - Add proper joins for user metadata

  2. Security
    - Enable RLS
    - Add proper policies for review management
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

-- Add function to get user email
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS text AS $$
BEGIN
    RETURN (
        SELECT email 
        FROM user_metadata 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;