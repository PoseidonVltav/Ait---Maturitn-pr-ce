/*
  # Fix admin review policies and functions

  1. Changes
    - Update review policies to allow admins to delete any review
    - Add check_admin function with unique name
    - Fix policy definitions

  2. Security
    - Maintain RLS
    - Add proper admin checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view reviews" ON business_reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON business_reviews;
DROP POLICY IF EXISTS "Users can manage their own reviews" ON business_reviews;

-- Create function to check if user is admin with unique name
CREATE OR REPLACE FUNCTION check_user_admin_status(user_id uuid)
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_metadata
        WHERE id = user_id
        AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql;

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
        AND business_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM business_profiles
            WHERE id = business_id
            AND status = 'active'
        )
    );

CREATE POLICY "Users can update their own reviews"
    ON business_reviews
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and admins can delete reviews"
    ON business_reviews
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id 
        OR check_user_admin_status(auth.uid())
    );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_user_admin_status TO authenticated;