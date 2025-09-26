-- Políticas para permitir upload de imagens de eventos
-- Usuários podem fazer upload de suas próprias imagens de eventos
CREATE POLICY "Users can upload event images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'user-uploads' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'events'
);

-- Usuários podem ver suas próprias imagens de eventos
CREATE POLICY "Users can view event images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'user-uploads' 
  AND (
    (storage.foldername(name))[1] = 'events' 
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Usuários podem atualizar suas próprias imagens
CREATE POLICY "Users can update their own images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'user-uploads' 
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = 'events'
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Usuários podem deletar suas próprias imagens
CREATE POLICY "Users can delete their own images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'user-uploads' 
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = 'events'
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);