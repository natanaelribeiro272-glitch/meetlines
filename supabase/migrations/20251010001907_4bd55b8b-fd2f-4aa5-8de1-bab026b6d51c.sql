-- Create storage policies for admins to upload platform event images
CREATE POLICY "Admins can upload platform event images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'platform-events'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update platform event images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'platform-events'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete platform event images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'platform-events'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Anyone can view platform event images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'platform-events'
);