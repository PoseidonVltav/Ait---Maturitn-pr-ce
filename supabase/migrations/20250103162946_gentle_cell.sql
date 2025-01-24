/*
  # Business and Images Tables

  1. New Tables
    - `businesses`: Core business table
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
    
    - `business_images`: Stores images for businesses
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key)
      - `image_url` (text)
      - `title` (text, optional)
      - `order` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Business owners can manage their data
    - Public can view business data
*/

-- Create the businesses table first
CREATE TABLE IF NOT EXISTS businesses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on businesses
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Policies for businesses
CREATE POLICY "Users can manage their own businesses"
    ON businesses
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can view businesses"
    ON businesses
    FOR SELECT
    TO public
    USING (true);

-- Now create the business_images table
CREATE TABLE IF NOT EXISTS business_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    title text,
    "order" integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_business_images_business_id ON business_images(business_id);

-- Create function to check image count
CREATE OR REPLACE FUNCTION check_business_images_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM business_images
    WHERE business_id = NEW.business_id
  ) >= 20 THEN
    RAISE EXCEPTION 'Maximum number of images (20) exceeded for this business';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce limit
CREATE TRIGGER enforce_business_images_limit
  BEFORE INSERT ON business_images
  FOR EACH ROW
  EXECUTE FUNCTION check_business_images_limit();

-- Enable RLS on business_images
ALTER TABLE business_images ENABLE ROW LEVEL SECURITY;

-- Policies for business_images
CREATE POLICY "Business owners can manage their images"
    ON business_images
    FOR ALL
    TO authenticated
    USING (business_id IN (
        SELECT id FROM businesses WHERE user_id = auth.uid()
    ))
    WITH CHECK (business_id IN (
        SELECT id FROM businesses WHERE user_id = auth.uid()
    ));

CREATE POLICY "Public can view business images"
    ON business_images
    FOR SELECT
    TO public
    USING (true);