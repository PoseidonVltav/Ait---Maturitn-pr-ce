/*
  # Create Admin Users Table

  1. New Tables
    - `admin_users`: Store admin user references
      - Links to auth.users
      - Tracks admin role and permissions
*/

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage admin users
CREATE POLICY "Super admins can manage admin users"
    ON admin_users
    FOR ALL
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT user_id FROM admin_users WHERE role = 'super_admin'
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM admin_users WHERE role = 'super_admin'
        )
    );

-- All admins can view admin users
CREATE POLICY "Admins can view admin users"
    ON admin_users
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT user_id FROM admin_users
        )
    );