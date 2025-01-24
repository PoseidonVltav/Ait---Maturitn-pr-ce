-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS update_review_reaction_counts_insert ON review_reactions;
DROP TRIGGER IF EXISTS update_review_reaction_counts_delete ON review_reactions;
DROP TRIGGER IF EXISTS update_review_reaction_counts_update ON review_reactions;
DROP FUNCTION IF EXISTS update_review_reaction_counts();

-- Create new function to update review reaction counts
CREATE OR REPLACE FUNCTION update_review_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment the appropriate counter
        IF NEW.reaction_type = 'like' THEN
            UPDATE business_reviews
            SET likes = likes + 1
            WHERE id = NEW.review_id;
        ELSE
            UPDATE business_reviews
            SET dislikes = dislikes + 1
            WHERE id = NEW.review_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement the appropriate counter
        IF OLD.reaction_type = 'like' THEN
            UPDATE business_reviews
            SET likes = GREATEST(likes - 1, 0)
            WHERE id = OLD.review_id;
        ELSE
            UPDATE business_reviews
            SET dislikes = GREATEST(dislikes - 1, 0)
            WHERE id = OLD.review_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create new triggers
CREATE TRIGGER update_review_reaction_counts_insert
    AFTER INSERT ON review_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_review_reaction_counts();

CREATE TRIGGER update_review_reaction_counts_delete
    AFTER DELETE ON review_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_review_reaction_counts();

-- Reset all counts to ensure accuracy
WITH reaction_counts AS (
    SELECT 
        review_id,
        COUNT(*) FILTER (WHERE reaction_type = 'like') as like_count,
        COUNT(*) FILTER (WHERE reaction_type = 'dislike') as dislike_count
    FROM review_reactions
    GROUP BY review_id
)
UPDATE business_reviews br
SET 
    likes = COALESCE(rc.like_count, 0),
    dislikes = COALESCE(rc.dislike_count, 0)
FROM reaction_counts rc
WHERE br.id = rc.review_id;