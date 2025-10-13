-- Create table to track organizer payouts
CREATE TABLE public.organizer_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  gross_amount NUMERIC NOT NULL DEFAULT 0,
  platform_fee NUMERIC NOT NULL DEFAULT 0,
  processing_fee NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL DEFAULT 0,
  payout_due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payout_status TEXT NOT NULL DEFAULT 'pending',
  payout_date TIMESTAMP WITH TIME ZONE,
  payout_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizer_payouts ENABLE ROW LEVEL SECURITY;

-- Admins can manage all payouts
CREATE POLICY "Admins can manage all payouts"
ON public.organizer_payouts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Organizers can view their own payouts
CREATE POLICY "Organizers can view their own payouts"
ON public.organizer_payouts
FOR SELECT
USING (organizer_id IN (
  SELECT id FROM organizers WHERE user_id = auth.uid()
));

-- Add index for performance
CREATE INDEX idx_organizer_payouts_event_id ON public.organizer_payouts(event_id);
CREATE INDEX idx_organizer_payouts_organizer_id ON public.organizer_payouts(organizer_id);
CREATE INDEX idx_organizer_payouts_status ON public.organizer_payouts(payout_status);

-- Trigger to update updated_at
CREATE TRIGGER update_organizer_payouts_updated_at
BEFORE UPDATE ON public.organizer_payouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();