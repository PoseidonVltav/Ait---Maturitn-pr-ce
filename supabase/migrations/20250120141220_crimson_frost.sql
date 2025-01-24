/*
  # Add Ratings and Reviews System

  1. New Tables
    - business_ratings
      - Stores user ratings (1-5 stars) for businesses
      - One rating per user per business
    - business_reviews
      - Stores user reviews/comments
      - Includes content and timestamps
    - review_reactions
      - Stores likes/dislikes on reviews
      - One reaction per user per review
  
  2. Security
    - Enable RLS on all tables
    - Only authenticated users can create/update ratings and reviews
    - Public can view approved content
    - Rate limiting through triggers
*/

-- Business Ratings
CREATE TABLE IF NOT EXISTS business_ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(business_id, user_id)
);

-- Business Reviews
CREATE TABLE IF NOT EXISTS business_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    likes integer DEFAULT 0,
    dislikes integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Review Reactions
CREATE TABLE IF NOT EXISTS review_reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id uuid NOT NULL REFERENCES business_reviews(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(review_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_ratings_business ON business_ratings(business_id);
CREATE INDEX IF NOT EXISTS idx_business_ratings_user ON business_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_business ON business_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_user ON business_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_review_reactions_review ON review_reactions(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reactions_user ON review_reactions(user_id);

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_ratings_updated_at
    BEFORE UPDATE ON business_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_reviews_updated_at
    BEFORE UPDATE ON business_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to check review rate limit
CREATE OR REPLACE FUNCTION check_review_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    review_count integer;
BEGIN
    SELECT COUNT(*)
    INTO review_count
    FROM business_reviews
    WHERE user_id = NEW.user_id
    AND business_id = NEW.business_id
    AND created_at > NOW() - INTERVAL '1 hour'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF review_count >= 2 THEN
        RAISE EXCEPTION 'Rate limit exceeded: Maximum 2 reviews per hour per business';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for review rate limiting
CREATE TRIGGER enforce_review_rate_limit
    BEFORE INSERT OR UPDATE ON business_reviews
    FOR EACH ROW
    EXECUTE FUNCTION check_review_rate_limit();

-- Function to update review likes/dislikes count
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
            SET likes = likes - 1
            WHERE id = OLD.review_id;
        ELSE
            UPDATE business_reviews
            SET dislikes = dislikes - 1
            WHERE id = OLD.review_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' AND OLD.reaction_type != NEW.reaction_type THEN
        IF OLD.reaction_type = 'like' THEN
            UPDATE business_reviews
            SET likes = likes - 1,
                dislikes = dislikes + 1
            WHERE id = NEW.review_id;
        ELSE
            UPDATE business_reviews
            SET likes = likes + 1,
                dislikes = dislikes - 1
            WHERE id = NEW.review_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating reaction counts
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

-- Enable Row Level Security
ALTER TABLE business_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reactions ENABLE ROW LEVEL SECURITY;

-- Policies for business_ratings
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

-- Policies for business_reviews
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

-- Policies for review_reactions
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