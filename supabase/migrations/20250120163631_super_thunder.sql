-- Add columns for review system if they don't exist
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS review_requested boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS review_requested_at timestamptz,
ADD COLUMN IF NOT EXISTS review_deadline timestamptz,
ADD COLUMN IF NOT EXISTS timeout_reason text;

-- Function to calculate review deadline (5 working days)
CREATE OR REPLACE FUNCTION calculate_review_deadline(start_timestamp timestamptz)
RETURNS timestamptz AS $$
DECLARE
    next_date timestamptz := start_timestamp;
    working_days_count integer := 0;
BEGIN
    WHILE working_days_count < 5 LOOP
        -- Add one day
        next_date := next_date + interval '1 day';
        
        -- Check if it's a weekday (1-5, Monday-Friday)
        IF EXTRACT(DOW FROM next_date) NOT IN (0, 6) THEN
            working_days_count := working_days_count + 1;
        END IF;
    END LOOP;
    
    RETURN next_date;
END;
$$ LANGUAGE plpgsql;

-- Function to handle review request
CREATE OR REPLACE FUNCTION request_business_review(business_profile_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE business_profiles
    SET 
        review_requested = true,
        review_requested_at = now(),
        review_deadline = calculate_review_deadline(now())
    WHERE id = business_profile_id
    AND is_timeout = true
    AND EXISTS (
        SELECT 1 FROM businesses 
        WHERE businesses.id = business_profiles.business_id 
        AND businesses.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timeout policy to include review status
DROP POLICY IF EXISTS "Public can view non-timeout business profiles" ON business_profiles;

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

-- Drop existing review request policy if it exists
DROP POLICY IF EXISTS "Business owners can request review" ON business_profiles;

-- Create new policy for business owners to request review
CREATE POLICY "Business owners can request review update"
    ON business_profiles
    FOR UPDATE
    TO authenticated
    USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT EXECUTE ON FUNCTION request_business_review TO authenticated;