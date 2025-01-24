/*
  # Update business_images table
  
  1. Changes
    - Add type column for distinguishing between company and product images
    - Add description column for image details
*/

-- Add new columns to business_images if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_images' AND column_name = 'type'
  ) THEN
    ALTER TABLE business_images 
    ADD COLUMN type text NOT NULL DEFAULT 'product' 
    CHECK (type IN ('product', 'company'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_images' AND column_name = 'description'
  ) THEN
    ALTER TABLE business_images 
    ADD COLUMN description text;
  END IF;
END $$;

-- Create index for faster queries by type
CREATE INDEX IF NOT EXISTS idx_business_images_type 
ON business_images(business_id, type);