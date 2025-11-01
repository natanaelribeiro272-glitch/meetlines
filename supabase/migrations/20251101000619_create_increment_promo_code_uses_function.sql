/*
  # Create Promo Code Increment Function

  1. New Function
    - `increment_promo_code_uses` - Incrementa o contador de usos de um código promocional

  2. Purpose
    - Atomicamente incrementar current_uses quando um código é usado com sucesso
*/

CREATE OR REPLACE FUNCTION increment_promo_code_uses(promo_code_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE promo_codes
  SET current_uses = current_uses + 1
  WHERE id = promo_code_id_param;
END;
$$;