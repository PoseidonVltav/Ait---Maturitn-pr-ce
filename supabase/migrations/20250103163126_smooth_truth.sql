/*
  # Create Business Related Tables

  1. New Tables
    - `business_profiles`: Extended business information
    - `categories`: Business categories
    - `business_categories`: Many-to-many relationship
    - `business_hours`: Operating hours
    - `special_hours`: Special operating hours
    - `reviews`: Customer reviews
*/

-- Business Profiles
CREATE TABLE IF NOT EXISTS business_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    short_description text,
    phone text,
    email text,
    website text,
    street_address text,
    city text,
    postal_code text,
    country text DEFAULT 'Czech Republic',
    latitude numeric(10,8),
    longitude numeric(11,8),
    is_verified boolean DEFAULT false,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(business_id)
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    parent_id uuid REFERENCES categories(id),
    description text,
    icon text,
    "order" integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Business Categories (Many-to-Many)
CREATE TABLE IF NOT EXISTS business_categories (
    business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
    category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (business_id, category_id),
    created_at timestamptz DEFAULT now()
);

-- Business Hours
CREATE TABLE IF NOT EXISTS business_hours (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time time NOT NULL,
    close_time time NOT NULL,
    is_closed boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(business_id, day_of_week)
);

-- Special Hours
CREATE TABLE IF NOT EXISTS special_hours (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    date date NOT NULL,
    open_time time,
    close_time time,
    is_closed boolean DEFAULT false,
    note text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(business_id, date)
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title text,
    content text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_anonymous boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(business_id, user_id)
);

-- Enable RLS
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Business Profiles Policies
CREATE POLICY "Business owners can manage their profiles"
    ON business_profiles
    FOR ALL
    TO authenticated
    USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
    WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Public can view active business profiles"
    ON business_profiles
    FOR SELECT
    TO public
    USING (status = 'active');

-- Categories Policies
CREATE POLICY "Admins can manage categories"
    ON categories
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "Public can view active categories"
    ON categories
    FOR SELECT
    TO public
    USING (is_active = true);

-- Business Categories Policies
CREATE POLICY "Business owners can manage their categories"
    ON business_categories
    FOR ALL
    TO authenticated
    USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
    WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Public can view business categories"
    ON business_categories
    FOR SELECT
    TO public
    USING (true);

-- Business Hours Policies
CREATE POLICY "Business owners can manage their hours"
    ON business_hours
    FOR ALL
    TO authenticated
    USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
    WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Public can view business hours"
    ON business_hours
    FOR SELECT
    TO public
    USING (true);

-- Special Hours Policies
CREATE POLICY "Business owners can manage their special hours"
    ON special_hours
    FOR ALL
    TO authenticated
    USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
    WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Public can view special hours"
    ON special_hours
    FOR SELECT
    TO public
    USING (true);

-- Reviews Policies
CREATE POLICY "Users can create and manage their reviews"
    ON reviews
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can view approved reviews"
    ON reviews
    FOR SELECT
    TO public
    USING (status = 'approved');

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_profiles_status ON business_profiles(status);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_business_day ON business_hours(business_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_special_hours_business_date ON special_hours(business_id, date);
CREATE INDEX IF NOT EXISTS idx_reviews_business_status ON reviews(business_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Update function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_business_profiles_updated_at
    BEFORE UPDATE ON business_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_business_hours_updated_at
    BEFORE UPDATE ON business_hours
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();