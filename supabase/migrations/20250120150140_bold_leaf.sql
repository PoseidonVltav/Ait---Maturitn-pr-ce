/*
  # Fix user types, admin functionality and reviews

  1. Changes
    - Add missing foreign key relationships for reviews
    - Fix user type checking in user_metadata
    - Add admin functionality for reviews and timeouts
    - Fix review display issues
*/

-- Drop existing policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins can manage all businesses" ON business_profiles;
    DROP POLICY IF EXISTS "Public can view active non-timeout business profiles" ON business_profiles;
    DROP POLICY IF EXISTS "Admins can manage all reviews" ON business_reviews;
    DROP POLICY IF EXISTS "Business owners can manage their own businesses" ON business_profiles;
END $$;

-- Fix user_metadata for existing users
UPDATE public.user_metadata
SET user_type = 'business'
WHERE id IN (
    SELECT user_id 
    FROM businesses
);

-- Fix specific user
UPDATE public.user_metadata
SET user_type = 'business'
WHERE email = 'email4something@seznam.cz';

-- Add missing foreign key for user references in reviews
ALTER TABLE business_reviews
DROP CONSTRAINT IF EXISTS business_reviews_user_id_fkey,
ADD CONSTRAINT business_reviews_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Recreate policies with fixed conditions
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

-- Fix review policies
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

-- Remove rate limit for admins
CREATE OR REPLACE FUNCTION check_review_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    review_count integer;
    is_admin boolean;
BEGIN
    -- Check if user is admin
    SELECT um.is_admin INTO is_admin
    FROM user_metadata um
    WHERE um.id = NEW.user_id;

    -- Skip check for admins
    IF is_admin THEN
        RETURN NEW;
    END IF;

    -- Check rate limit for non-admin users
    SELECT COUNT(*)
    INTO review_count
    FROM business_reviews
    WHERE user_id = NEW.user_id
    AND business_id = NEW.business_id
    AND created_at > NOW() - INTERVAL '1 hour'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF review_count >= 2 THEN
        RAISE EXCEPTION 'Rate limit exceeded: Maximum 2 reviews per hour per business';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;