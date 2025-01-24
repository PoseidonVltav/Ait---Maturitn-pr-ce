-- Drop existing triggers and functions first
DROP TRIGGER IF EXISTS update_review_reaction_counts_insert ON review_reactions;
DROP TRIGGER IF EXISTS update_review_reaction_counts_delete ON review_reactions;
DROP TRIGGER IF EXISTS update_review_reaction_counts_update ON review_reactions;
DROP FUNCTION IF EXISTS update_review_reaction_counts();

-- Drop existing tables to recreate them with correct references
DROP TABLE IF EXISTS review_reactions;
DROP TABLE IF EXISTS business_reviews;
DROP TABLE IF EXISTS business_ratings;

-- Recreate tables with correct references to business_profiles instead of businesses
CREATE TABLE IF NOT EXISTS business_ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(business_id, user_id)
);

CREATE TABLE IF NOT EXISTS business_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    likes integer DEFAULT 0,
    dislikes integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id uuid NOT NULL REFERENCES business_reviews(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(review_id, user_id)
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_business_ratings_business ON business_ratings(business_id);
CREATE INDEX IF NOT EXISTS idx_business_ratings_user ON business_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_business ON business_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_user ON business_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_review_reactions_review ON review_reactions(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reactions_user ON review_reactions(user_id);

-- Recreate function to update review likes/dislikes count
CREATE OR REPLACE FUNCTION update_review_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
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
        IF OLD.reaction_type = 'like' THEN
            UPDATE business_reviews
            SET likes = GREATEST(likes - 1, 0)
            WHERE id = OLD.review_id;
        ELSE
            UPDATE business_reviews
            SET dislikes = GREATEST(dislikes - 1, 0)
            WHERE id = OLD.review_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' AND OLD.reaction_type != NEW.reaction_type THEN
        IF OLD.reaction_type = 'like' THEN
            UPDATE business_reviews
            SET likes = GREATEST(likes - 1, 0),
                dislikes = dislikes + 1
            WHERE id = NEW.review_id;
        ELSE
            UPDATE business_reviews
            SET likes = likes + 1,
                dislikes = GREATEST(dislikes - 1, 0)
            WHERE id = NEW.review_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER update_review_reaction_counts_insert
    AFTER INSERT ON review_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_review_reaction_counts();

CREATE TRIGGER update_review_reaction_counts_delete
    AFTER DELETE ON review_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_review_reaction_counts();

CREATE TRIGGER update_review_reaction_counts_update
    AFTER UPDATE ON review_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_review_reaction_counts();

-- Enable RLS
ALTER TABLE business_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reactions ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Public can view ratings"
    ON business_ratings
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can rate businesses"
    ON business_ratings
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view reviews"
    ON business_reviews
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can manage their reviews"
    ON business_reviews
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view reactions"
    ON review_reactions
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can manage their reactions"
    ON review_reactions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);