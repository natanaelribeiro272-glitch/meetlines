/*
  # Create function to increment ticket quantity sold

  1. New Function
    - `increment_ticket_sold` - Safely increments the quantity_sold column for a ticket type
    - Parameters:
      - ticket_type_id (uuid): ID of the ticket type to update
      - quantity_to_add (integer): Number of tickets sold to add
    - Returns void
    - Uses atomic increment to prevent race conditions

  2. Purpose
    - Called by webhook when payment is confirmed
    - Ensures accurate tracking of sold tickets
    - Thread-safe operation for concurrent sales
*/

-- Drop function if exists
DROP FUNCTION IF EXISTS public.increment_ticket_sold(uuid, integer);

-- Create function to increment ticket quantity_sold
CREATE OR REPLACE FUNCTION public.increment_ticket_sold(
  ticket_type_id uuid,
  quantity_to_add integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update quantity_sold atomically
  UPDATE public.ticket_types
  SET quantity_sold = COALESCE(quantity_sold, 0) + quantity_to_add,
      updated_at = now()
  WHERE id = ticket_type_id;
  
  -- Check if any row was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket type with id % not found', ticket_type_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.increment_ticket_sold(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ticket_sold(uuid, integer) TO service_role;
