-- Fix likes/dislikes counting
CREATE OR REPLACE FUNCTION update_review_reaction_counts()
RETURNS TRIGGER AS $$
DECLARE
    current_likes integer;
    current_dislikes integer;
BEGIN
    -- Get current counts
    SELECT likes, dislikes INTO current_likes, current_dislikes
    FROM business_reviews
    WHERE id = COALESCE(NEW.review_id, OLD.review_id);

    IF TG_OP = 'INSERT' THEN
        IF NEW.reaction_type = 'like' THEN
            UPDATE business_reviews
            SET likes = current_likes + 1
            WHERE id = NEW.review_id;
        ELSE
            UPDATE business_reviews
            SET dislikes = current_dislikes + 1
            WHERE id = NEW.review_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.reaction_type = 'like' THEN
            UPDATE business_reviews
            SET likes = GREATEST(current_likes - 1, 0)
            WHERE id = OLD.review_id;
        ELSE
            UPDATE business_reviews
            SET dislikes = GREATEST(current_dislikes - 1, 0)
            WHERE id = OLD.review_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to verify current password
CREATE OR REPLACE FUNCTION verify_current_password(user_id uuid, current_password text)
RETURNS boolean AS $$
DECLARE
    stored_password text;
BEGIN
    SELECT encrypted_password INTO stored_password
    FROM auth.users
    WHERE id = user_id;

    RETURN auth.verify_password(current_password, stored_password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;