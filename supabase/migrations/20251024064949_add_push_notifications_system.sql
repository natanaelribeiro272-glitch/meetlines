/*
  # Sistema de Notificações Push

  1. Nova Tabela
    - `push_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `token` (text, token do dispositivo)
      - `platform` (text, 'ios' ou 'android')
      - `device_info` (jsonb, informações do dispositivo)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Alterações
    - Adicionar novos tipos de notificação: 'friend_request', 'friend_accepted', 'user_like', 'user_message'
    - Adicionar campo `from_user_id` na tabela notifications para rastrear quem enviou

  3. Segurança
    - Enable RLS em push_tokens
    - Políticas para usuários gerenciarem seus próprios tokens
    - Atualizar políticas de notifications

  4. Índices
    - Índices para melhorar performance de busca por tokens
*/

-- Criar tabela de tokens push
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, token)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_platform ON public.push_tokens(platform);

-- Adicionar campo from_user_id na tabela notifications se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'from_user_id'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN from_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Remover constraint antiga de type se existir
DO $$
BEGIN
  ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Adicionar novo constraint com todos os tipos
DO $$
BEGIN
  ALTER TABLE public.notifications 
    ADD CONSTRAINT notifications_type_check 
    CHECK (type IN (
      'event_created', 
      'event_updated', 
      'event_cancelled', 
      'user_like', 
      'follower', 
      'user_message',
      'friend_request',
      'friend_accepted'
    ));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Habilitar RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas para push_tokens
CREATE POLICY "Users can view own push tokens"
  ON public.push_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push tokens"
  ON public.push_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push tokens"
  ON public.push_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push tokens"
  ON public.push_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Índice adicional para from_user_id em notifications
CREATE INDEX IF NOT EXISTS idx_notifications_from_user_id ON public.notifications(from_user_id);
