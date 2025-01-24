-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS prevent_self_reactions_trigger ON review_reactions;
DROP FUNCTION IF EXISTS prevent_self_reactions();

-- Create improved function to prevent self-reactions
CREATE OR REPLACE FUNCTION prevent_self_reactions()
RETURNS TRIGGER AS $$
DECLARE
    review_author_id uuid;
BEGIN
    -- Get the author of the review
    SELECT user_id INTO review_author_id
    FROM business_reviews
    WHERE id = NEW.review_id;

    -- Check if the user is trying to react to their own review
    IF NEW.user_id = review_author_id THEN
        RAISE EXCEPTION 'Users cannot react to their own reviews';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent self-reactions
CREATE TRIGGER prevent_self_reactions_trigger
    BEFORE INSERT OR UPDATE ON review_reactions
    FOR EACH ROW
    EXECUTE FUNCTION prevent_self_reactions();

-- Ensure unique reactions per user per review
ALTER TABLE review_reactions
DROP CONSTRAINT IF EXISTS unique_user_review_reaction;

ALTER TABLE review_reactions
ADD CONSTRAINT unique_user_review_reaction 
UNIQUE (user_id, review_id);