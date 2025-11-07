/*
  # Create increment_tickets_sold function
  
  1. Function
    - Creates RPC function to increment tickets_sold counter
    - Updates ticket_types.quantity_sold atomically
    
  2. Security
    - Function is available for authenticated users
    - Ensures atomic increment operation
*/

CREATE OR REPLACE FUNCTION increment_tickets_sold(
  p_ticket_type_id uuid,
  p_quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ticket_types
  SET quantity_sold = COALESCE(quantity_sold, 0) + p_quantity
  WHERE id = p_ticket_type_id;
END;
$$;