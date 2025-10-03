-- Add relationship_status to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'relationship_status') THEN
    CREATE TYPE public.relationship_status AS ENUM ('solteiro', 'namorando', 'casado', 'relacionamento_aberto', 'preferencia_nao_informar');
  END IF;
END $$;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS relationship_status public.relationship_status DEFAULT 'preferencia_nao_informar';