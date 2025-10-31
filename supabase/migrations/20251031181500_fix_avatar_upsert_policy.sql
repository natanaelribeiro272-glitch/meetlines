/*
  # Fix Avatar Upload Upsert Policy

  1. Changes
    - Add specific INSERT policy for user avatar uploads
    - Ensure users can upsert (insert or update) their avatar files

  2. Security
    - Users can only upload to their own folder (user_id)
    - Maintains all existing security policies
*/

-- Drop and recreate the user upload policy to ensure it works with upsert
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;

CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Ensure the update policy covers avatars
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;

CREATE POLICY "Users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = 'events'
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

COMMENT ON POLICY "Users can upload their own avatars" ON storage.objects IS 'Allows users to upload/upsert avatar images to their own folder';
COMMENT ON POLICY "Users can update their own images" ON storage.objects IS 'Allows users to update their own avatar and event images';
