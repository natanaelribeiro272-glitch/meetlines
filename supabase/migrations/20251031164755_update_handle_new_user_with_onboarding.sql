/*
  # Atualizar função handle_new_user para incluir campos de confirmação

  1. Mudança:
    - Atualiza a função para incluir email_confirmed = false
    - Atualiza a função para incluir onboarding_completed = false
    - Novos usuários começam sem email confirmado e sem onboarding completo
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, display_name, role, email_confirmed, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'::user_role),
    false,
    false
  );
  RETURN NEW;
END;
$$;
