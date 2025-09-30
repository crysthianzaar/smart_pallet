-- Migration to fix ID field types for pallet-related tables
-- This allows using custom ID format (CTX-XXXXX) instead of UUID

-- Fix pallet_photos.id field type
ALTER TABLE pallet_photos 
ALTER COLUMN id TYPE TEXT;

-- Fix selected_skus.id field type (if it exists and is UUID)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'selected_skus' 
        AND column_name = 'id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE selected_skus ALTER COLUMN id TYPE TEXT;
    END IF;
END $$;

-- Add comments to document the changes
COMMENT ON COLUMN pallet_photos.id IS 'Custom format ID (CTX-DDMMYYYYHHMMSS) for pallet photos';

-- Verify the changes
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('pallet_photos', 'selected_skus') 
AND column_name = 'id'
ORDER BY table_name;
