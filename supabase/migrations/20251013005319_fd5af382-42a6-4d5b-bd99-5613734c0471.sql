-- Create ticket types table for event ticketing
CREATE TABLE IF NOT EXISTS public.ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  sales_start_date TIMESTAMP WITH TIME ZONE,
  sales_end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  min_quantity_per_purchase INTEGER DEFAULT 1,
  max_quantity_per_purchase INTEGER DEFAULT 10,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ticket sales table
CREATE TABLE IF NOT EXISTS public.ticket_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE RESTRICT,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  payment_processing_fee DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  buyer_document TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE
);

-- Create event ticket settings table
CREATE TABLE IF NOT EXISTS public.event_ticket_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
  accepts_platform_payment BOOLEAN DEFAULT false,
  fee_payer TEXT DEFAULT 'buyer',
  platform_fee_percentage DECIMAL(5,2) DEFAULT 10.00,
  payment_processing_fee_percentage DECIMAL(5,2) DEFAULT 3.99,
  payment_processing_fee_fixed DECIMAL(10,2) DEFAULT 0.39,
  cancellation_policy TEXT,
  accepts_pix BOOLEAN DEFAULT true,
  accepts_credit_card BOOLEAN DEFAULT true,
  accepts_debit_card BOOLEAN DEFAULT true,
  max_installments INTEGER DEFAULT 12,
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  terms_accepted_ip TEXT,
  stripe_account_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_ticket_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticket_types
CREATE POLICY "Public can view active ticket types"
  ON public.ticket_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Organizers can manage their event ticket types"
  ON public.ticket_types FOR ALL
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- RLS Policies for ticket_sales
CREATE POLICY "Users can view their own purchases"
  ON public.ticket_sales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Organizers can view sales for their events"
  ON public.ticket_sales FOR SELECT
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create ticket purchases"
  ON public.ticket_sales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for event_ticket_settings
CREATE POLICY "Public can view event ticket settings"
  ON public.event_ticket_settings FOR SELECT
  USING (true);

CREATE POLICY "Organizers can manage their event ticket settings"
  ON public.event_ticket_settings FOR ALL
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_ticket_types_event_id ON public.ticket_types(event_id);
CREATE INDEX idx_ticket_sales_event_id ON public.ticket_sales(event_id);
CREATE INDEX idx_ticket_sales_user_id ON public.ticket_sales(user_id);
CREATE INDEX idx_ticket_sales_payment_status ON public.ticket_sales(payment_status);
CREATE INDEX idx_event_ticket_settings_event_id ON public.event_ticket_settings(event_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_ticket_types_updated_at
  BEFORE UPDATE ON public.ticket_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_ticket_settings_updated_at
  BEFORE UPDATE ON public.event_ticket_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();