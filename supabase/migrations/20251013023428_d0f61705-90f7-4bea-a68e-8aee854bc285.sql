-- Drop existing policy if exists
DROP POLICY IF EXISTS "Admins can view all ticket sales" ON public.ticket_sales;

-- Allow admins to view all ticket sales
CREATE POLICY "Admins can view all ticket sales"
ON public.ticket_sales
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));