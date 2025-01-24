-- Drop existing constraint if it exists
ALTER TABLE review_reactions
DROP CONSTRAINT IF EXISTS prevent_self_reactions;

-- Create function to prevent self-reactions
CREATE OR REPLACE FUNCTION prevent_self_reactions()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM business_reviews 
        WHERE id = NEW.review_id 
        AND user_id = NEW.user_id
    ) THEN
        RAISE EXCEPTION 'Users cannot react to their own reviews';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent self-reactions
CREATE TRIGGER prevent_self_reactions_trigger
    BEFORE INSERT ON review_reactions
    FOR EACH ROW
    EXECUTE FUNCTION prevent_self_reactions();

-- Create unique constraint to prevent multiple reactions from same user
ALTER TABLE review_reactions
DROP CONSTRAINT IF EXISTS unique_user_review_reaction;

ALTER TABLE review_reactions
ADD CONSTRAINT unique_user_review_reaction 
UNIQUE (user_id, review_id);