-- Migration: Add weight and dimensions fields to skus table
-- Execute this in Supabase SQL Editor

ALTER TABLE skus 
ADD COLUMN weight DECIMAL(10,3),
ADD COLUMN dimensions VARCHAR(100);

-- Update existing records with default values if needed
-- UPDATE skus SET weight = 0 WHERE weight IS NULL;
-- UPDATE skus SET dimensions = '' WHERE dimensions IS NULL;
