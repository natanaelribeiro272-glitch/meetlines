-- Criar políticas de storage para stories

-- Política para permitir usuários autenticados fazerem upload de suas próprias stories
CREATE POLICY "Users can upload their own stories"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'stories'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Política para permitir visualização pública das stories
CREATE POLICY "Stories are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'stories'
);

-- Política para permitir usuários deletarem suas próprias stories
CREATE POLICY "Users can delete their own stories"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'stories'
  AND auth.uid()::text = (storage.foldername(name))[2]
);