/*
  # Adicionar tipos ENUM faltantes
  
  1. Novos tipos ENUM:
    - app_role: 'admin', 'moderator', 'user'
    - relationship_status: status de relacionamento do usuário
    - user_interest: tipo de interesse do usuário
  
  2. Segurança:
    - Os tipos são criados apenas se não existirem usando blocos DO
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'relationship_status') THEN
    CREATE TYPE public.relationship_status AS ENUM (
      'solteiro',
      'namorando', 
      'casado',
      'relacionamento_aberto',
      'preferencia_nao_informar'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_interest') THEN
    CREATE TYPE public.user_interest AS ENUM (
      'namoro',
      'network',
      'curtição',
      'amizade',
      'casual'
    );
  END IF;
END $$;