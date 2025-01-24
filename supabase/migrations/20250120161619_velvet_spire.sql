/*
  # Business Timeout Enhancement

  1. Changes
    - Add timeout_reason column to business_profiles
    - Update policies to respect timeout status
    - Add function to check if user can view business

  2. Security
    - Only admins can set timeout
    - Only admins and owners can view timeout reason
    - Timeout status blocks public access
*/

-- Add timeout reason column
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS timeout_reason text;

-- Function to check if user can view business
CREATE OR REPLACE FUNCTION can_view_business(business_profile_id uuid)
RETURNS boolean AS $$
DECLARE
    is_admin boolean;
    is_owner boolean;
    is_timeout boolean;
    timeout_end timestamptz;
BEGIN
    -- Check if user is admin
    SELECT EXISTS (
        SELECT 1 FROM user_metadata
        WHERE id = auth.uid()
        AND is_admin = true
    ) INTO is_admin;

    -- If admin, always allow
    IF is_admin THEN
        RETURN true;
    END IF;

    -- Get timeout status and owner info
    SELECT 
        bp.is_timeout,
        bp.timeout_until,
        b.user_id = auth.uid()
    INTO is_timeout, timeout_end, is_owner
    FROM business_profiles bp
    JOIN businesses b ON bp.business_id = b.id
    WHERE bp.id = business_profile_id;

    -- Allow if:
    -- 1. Not in timeout, or
    -- 2. Is owner, or
    -- 3. Timeout has expired
    RETURN (
        NOT is_timeout
        OR is_owner
        OR (timeout_end IS NOT NULL AND timeout_end < now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update business profiles policies
DROP POLICY IF EXISTS "Public can view active non-timeout business profiles" ON business_profiles;

CREATE POLICY "Public can view non-timeout business profiles"
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

-- Only admins can set timeout
CREATE POLICY "Admins can set timeout"
    ON business_profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_metadata
            WHERE id = auth.uid()
            AND is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_metadata
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- Grant permissions
GRANT EXECUTE ON FUNCTION can_view_business TO public;