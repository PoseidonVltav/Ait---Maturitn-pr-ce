/*
  # Fix admin access and user metadata

  1. Changes
    - Create public users table for metadata
    - Add RLS policies
    - Move admin and user type data to public table
*/

-- Create public users table for metadata
CREATE TABLE IF NOT EXISTS public.user_metadata (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text UNIQUE NOT NULL,
    is_admin boolean DEFAULT false,
    user_type text CHECK (user_type IN ('business', 'user')),
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_metadata ENABLE ROW LEVEL SECURITY;

-- Policies for user_metadata
CREATE POLICY "Users can view all metadata"
    ON public.user_metadata
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Users can update their own metadata"
    ON public.user_metadata
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Function to create user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_count int;
    username_val text;
BEGIN
    -- Get user count for username
    SELECT COUNT(*) INTO user_count FROM auth.users;
    username_val := 'Anonym' || (user_count + 1)::text;

    -- Insert metadata
    INSERT INTO public.user_metadata (id, username, is_admin, user_type)
    VALUES (
        NEW.id,
        username_val,
        CASE WHEN NEW.email = '1551kkd@gmail.com' THEN true ELSE false END,
        'user'
    );

    RETURN NEW;
END;
$$ language plpgsql security definer;