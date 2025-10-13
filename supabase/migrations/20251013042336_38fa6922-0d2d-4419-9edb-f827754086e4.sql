-- Permitir que organizadores façam upload de seus stories
CREATE POLICY "Organizers can upload their own stories"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'organizer-stories'
  AND (storage.foldername(name))[2]::uuid IN (
    SELECT id FROM organizers WHERE user_id = auth.uid()
  )
);

-- Permitir que organizadores atualizem seus stories
CREATE POLICY "Organizers can update their own stories"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'organizer-stories'
  AND (storage.foldername(name))[2]::uuid IN (
    SELECT id FROM organizers WHERE user_id = auth.uid()
  )
);

-- Permitir que organizadores deletem seus stories
CREATE POLICY "Organizers can delete their own stories"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'organizer-stories'
  AND (storage.foldername(name))[2]::uuid IN (
    SELECT id FROM organizers WHERE user_id = auth.uid()
  )
);

-- Permitir que todos visualizem stories de organizadores
CREATE POLICY "Anyone can view organizer stories"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'organizer-stories'
);