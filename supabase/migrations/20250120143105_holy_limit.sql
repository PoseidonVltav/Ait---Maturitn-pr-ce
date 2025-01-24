/*
  # Add admin functionality and username support

  1. Changes
    - Add username column to auth.users
    - Add admin functionality
    - Add review reports table
    - Add policies for admin actions

  2. Security
    - Enable RLS on new tables
    - Add policies for admin actions
*/

-- Add username column to auth.users if it doesn't exist
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create review reports table
CREATE TABLE IF NOT EXISTS review_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id uuid NOT NULL REFERENCES business_reviews(id) ON DELETE CASCADE,
    reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
    resolved_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    resolved_at timestamptz,
    UNIQUE(review_id, reporter_id)
);

-- Enable RLS on review_reports
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

-- Policies for review_reports
CREATE POLICY "Users can create reports"
    ON review_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
    ON review_reports
    FOR SELECT
    TO authenticated
    USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view and manage all reports"
    ON review_reports
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.is_admin = true
        )
    );

-- Add admin policies for business_reviews
CREATE POLICY "Admins can delete any review"
    ON business_reviews
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.is_admin = true
        )
    );

-- Add admin policies for business_profiles
CREATE POLICY "Admins can delete any business"
    ON business_profiles
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.is_admin = true
        )
    );

-- Function to set default username for new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
    user_count int;
BEGIN
    IF NEW.username IS NULL THEN
        SELECT COUNT(*) INTO user_count FROM auth.users;
        NEW.username := 'Anonym' || (user_count + 1)::text;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to set default username
CREATE OR REPLACE TRIGGER on_auth_user_created
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Set admin user
UPDATE auth.users
SET is_admin = true
WHERE email = '1551kkd@gmail.com';