-- Supabase Storage Setup for Pallet Images
-- Execute this in Supabase SQL Editor

-- Create storage bucket for pallet images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pallet-images', 'pallet-images', true);

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload pallet images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'pallet-images' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow public read access to pallet images
CREATE POLICY "Allow public read access to pallet images" ON storage.objects
FOR SELECT USING (bucket_id = 'pallet-images');

-- Create policy to allow authenticated users to update their own images
CREATE POLICY "Allow authenticated users to update pallet images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'pallet-images' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow authenticated users to delete pallet images
CREATE POLICY "Allow authenticated users to delete pallet images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'pallet-images' AND
  auth.role() = 'authenticated'
);
