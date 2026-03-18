-- supabase/migrations/010_logos_bucket.sql

-- Enable Storage Extension if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the "logos" bucket explicitly ensuring public read access
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure RLS is enabled on the generic objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Global SELECT access for public image viewing
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'logos' );

-- Policy 2: Authenticated users can insert/upload new objects into logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'logos' );

-- Policy 3: Authenticated users can explicitly update their own existing objects
CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'logos' );

-- Policy 4: Authenticated users can delete items in logos
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'logos' );
