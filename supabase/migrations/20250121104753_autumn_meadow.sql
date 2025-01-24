-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS update_review_reaction_counts_insert ON review_reactions;
DROP TRIGGER IF EXISTS update_review_reaction_counts_delete ON review_reactions;
DROP TRIGGER IF EXISTS update_review_reaction_counts_update ON review_reactions;
DROP FUNCTION IF EXISTS update_review_reaction_counts();

-- Create new function to update review reaction counts
CREATE OR REPLACE FUNCTION update_review_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT
    IF TG_OP = 'INSERT' THEN
        IF NEW.reaction_type = 'like' THEN
            UPDATE business_reviews
            SET likes = (
                SELECT COUNT(*)
                FROM review_reactions
                WHERE review_id = NEW.review_id
                AND reaction_type = 'like'
            )
            WHERE id = NEW.review_id;
        ELSE
            UPDATE business_reviews
            SET dislikes = (
                SELECT COUNT(*)
                FROM review_reactions
                WHERE review_id = NEW.review_id
                AND reaction_type = 'dislike'
            )
            WHERE id = NEW.review_id;
        END IF;
        RETURN NEW;
    
    -- For DELETE
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE business_reviews
        SET 
            likes = (
                SELECT COUNT(*)
                FROM review_reactions
                WHERE review_id = OLD.review_id
                AND reaction_type = 'like'
            ),
            dislikes = (
                SELECT COUNT(*)
                FROM review_reactions
                WHERE review_id = OLD.review_id
                AND reaction_type = 'dislike'
            )
        WHERE id = OLD.review_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
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
UPDATE business_reviews
SET 
    likes = (
        SELECT COUNT(*)
        FROM review_reactions
        WHERE review_id = business_reviews.id
        AND reaction_type = 'like'
    ),
    dislikes = (
        SELECT COUNT(*)
        FROM review_reactions
        WHERE review_id = business_reviews.id
        AND reaction_type = 'dislike'
    );