/*
  # Corrigir Política de INSERT em Eventos

  1. Problema
    - A política "Organizers can manage their own events" usa FOR ALL mas só tem USING
    - Isso impede INSERT pois FOR ALL precisa de USING e WITH CHECK
    - INSERT precisa do WITH CHECK para validar novos registros

  2. Solução
    - Remover política existente
    - Recriar com USING (para SELECT, UPDATE, DELETE) e WITH CHECK (para INSERT, UPDATE)
    - Garantir que organizadores possam criar eventos para seus próprios organizer_id

  3. Segurança
    - Mantém restrição de que organizadores só podem gerenciar seus próprios eventos
    - Permite que organizadores criem novos eventos
    - Permite que organizadores atualizem e excluam seus eventos
*/

-- Remover política existente
DROP POLICY IF EXISTS "Organizers can manage their own events" ON public.events;

-- Recriar política com USING e WITH CHECK
CREATE POLICY "Organizers can manage their own events"
  ON public.events
  FOR ALL
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM public.organizers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM public.organizers WHERE user_id = auth.uid()
    )
  );
