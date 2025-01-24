/*
  # Fix user type and admin functionality

  1. Changes
    - Drop existing user_metadata table and recreate with correct structure
    - Add policies for proper access control
    - Update handle_new_user function to properly set user type from registration
    - Add policies for admin access
*/

-- Create temporary table to store existing policies
CREATE TEMPORARY TABLE temp_policies AS
SELECT schemaname, tablename, policyname, cmd, qual, with_check, roles
FROM pg_policies
WHERE tablename = 'user_metadata';

-- Drop existing policies that depend on user_metadata
DO $$ 
BEGIN
    -- Drop business_profiles policies
    DROP POLICY IF EXISTS "Admins can manage all businesses" ON business_profiles;
    DROP POLICY IF EXISTS "Public can view active non-timeout business profiles" ON business_profiles;
    
    -- Drop business_reviews policies
    DROP POLICY IF EXISTS "Admins can manage all reviews" ON business_reviews;
END $$;

-- Now we can safely drop and recreate the user_metadata table
DROP TABLE IF EXISTS public.user_metadata CASCADE;

CREATE TABLE public.user_metadata (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    user_type text NOT NULL CHECK (user_type IN ('business', 'user')),
    is_admin boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_metadata ENABLE ROW LEVEL SECURITY;

-- Recreate policies for user_metadata
CREATE POLICY "Public can view user metadata"
    ON public.user_metadata
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Users can update their own metadata"
    ON public.user_metadata
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_metadata (
        id,
        email,
        user_type,
        is_admin
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'user'),
        CASE 
            WHEN NEW.email = '1551kkd@gmail.com' THEN true 
            ELSE false 
        END
    );
    RETURN NEW;
END;
$$ language plpgsql security definer;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Recreate the dependent policies for business_profiles
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

-- Recreate the dependent policies for business_reviews
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

-- Add policy for business owners
CREATE POLICY "Business owners can manage their own businesses"
    ON business_profiles
    FOR ALL
    TO authenticated
    USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE user_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM user_metadata
                WHERE user_metadata.id = auth.uid()
                AND user_metadata.user_type = 'business'
            )
        )
    );