/*
  # Adicionar Política de Admin para Eventos

  1. Mudanças
    - Adiciona política para permitir que admins criem eventos para qualquer organizador
    - Necessário para o fluxo de aprovação de solicitações de associação
  
  2. Segurança
    - Apenas usuários com role 'admin' podem inserir eventos para outros organizadores
    - Mantém a segurança de que organizadores só podem gerenciar seus próprios eventos
*/

-- Criar política para admins inserirem eventos
CREATE POLICY "Admins can create events for any organizer"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
