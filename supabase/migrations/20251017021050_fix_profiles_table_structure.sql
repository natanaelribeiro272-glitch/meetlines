/*
  # Corrigir estrutura da tabela profiles
  
  1. Mudanças:
    - Remove coluna `full_name` duplicada (usar `display_name`)
    - Garante que `user_id` seja NOT NULL e UNIQUE
    - Garante que haja apenas uma foreign key: user_id -> auth.users.id
    - Remove foreign key de `id` se existir
  
  2. Comportamento:
    - A coluna `id` é apenas um identificador UUID da linha
    - A coluna `user_id` é a referência para auth.users
*/

-- Remover full_name se existir (é redundante com display_name)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS full_name;

-- Garantir que user_id seja NOT NULL
DO $$
BEGIN
  -- Primeiro, deletar qualquer profile sem user_id
  DELETE FROM public.profiles WHERE user_id IS NULL;
  
  -- Depois tornar NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'user_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Adicionar constraint UNIQUE em user_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Remover foreign key de id se existir (id não deve referenciar auth.users)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Garantir que existe foreign key de user_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);