/*
  # Adicionar campo para controlar confirmação de email pendente

  1. Alterações
    - Adiciona coluna `email_confirmed` na tabela `profiles`
    - Adiciona coluna `onboarding_completed` na tabela `profiles`
    - Usuários começam com email não confirmado e onboarding não completo
    
  2. Segurança
    - Permite que usuários não confirmados façam login mas sejam redirecionados
*/

-- Adicionar coluna de confirmação de email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email_confirmed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_confirmed boolean DEFAULT false;
  END IF;
END $$;

-- Adicionar coluna de onboarding completo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;
END $$;

-- Criar índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_email_confirmed ON profiles(email_confirmed);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);
