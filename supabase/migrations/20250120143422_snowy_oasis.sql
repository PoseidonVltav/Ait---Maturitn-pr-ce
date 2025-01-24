/*
  # Fix admin login and user type handling

  1. Changes
    - Add user_type column to auth.users
    - Update admin handling
    - Add function to handle user type on signup
*/

-- Add user_type column to auth.users
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS user_type text CHECK (user_type IN ('business', 'user'));

-- Function to handle user type and admin status
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
    user_count int;
BEGIN
    -- Set default username if not provided
    IF NEW.username IS NULL THEN
        SELECT COUNT(*) INTO user_count FROM auth.users;
        NEW.username := 'Anonym' || (user_count + 1)::text;
    END IF;

    -- Set admin status for specific email
    IF NEW.email = '1551kkd@gmail.com' THEN
        NEW.is_admin = true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing users with default user type
UPDATE auth.users
SET user_type = 'user'
WHERE user_type IS NULL;