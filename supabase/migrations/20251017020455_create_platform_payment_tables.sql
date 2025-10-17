/*
  # Criar tabelas de plataforma, pagamentos e suporte
  
  1. Tabelas criadas:
    - platform_events: eventos gerenciados pela plataforma
    - event_claim_requests: solicitações de reivindicação de eventos
    - event_ticket_settings: configurações de ingressos
    - ticket_types: tipos de ingressos disponíveis
    - ticket_sales: vendas de ingressos
    - organizer_payouts: pagamentos aos organizadores
    - support_messages: mensagens de suporte
    - user_roles: papéis/permissões dos usuários
  
  2. Segurança:
    - RLS habilitado em todas as tabelas
    - Políticas de acesso apropriadas
*/

CREATE TABLE IF NOT EXISTS public.platform_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  title text NOT NULL,
  description text,
  event_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  location text NOT NULL,
  location_link text,
  image_url text,
  organizer_name text NOT NULL,
  category text[],
  max_attendees integer,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  claimed_by_organizer_id uuid REFERENCES public.organizers(id) ON DELETE SET NULL,
  created_by_admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  ticket_price numeric(10,2) DEFAULT 0,
  ticket_link text,
  auto_generated boolean DEFAULT false,
  approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  source_data jsonb
);

COMMENT ON COLUMN public.platform_events.end_date IS 'Data e hora de encerramento do evento (obrigatório)';
COMMENT ON COLUMN public.platform_events.ticket_price IS 'Preço do ingresso em reais. 0 significa gratuito';
COMMENT ON COLUMN public.platform_events.ticket_link IS 'Link externo para compra de ingressos (Sympla, Eventbrite, etc)';

CREATE TABLE IF NOT EXISTS public.event_claim_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  platform_event_id uuid NOT NULL REFERENCES public.platform_events(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  message text,
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.event_ticket_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  event_id uuid NOT NULL UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
  accepts_platform_payment boolean DEFAULT false,
  fee_payer text DEFAULT 'buyer',
  platform_fee_percentage numeric(5,2) DEFAULT 5.00,
  payment_processing_fee_percentage numeric(5,2) DEFAULT 3.99,
  payment_processing_fee_fixed numeric(10,2) DEFAULT 0.39,
  cancellation_policy text,
  accepts_pix boolean DEFAULT true,
  accepts_credit_card boolean DEFAULT true,
  accepts_debit_card boolean DEFAULT true,
  max_installments integer DEFAULT 12,
  terms_accepted boolean DEFAULT false,
  terms_accepted_at timestamp with time zone,
  terms_accepted_ip text,
  stripe_account_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_types (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  quantity integer NOT NULL,
  quantity_sold integer DEFAULT 0,
  sales_start_date timestamp with time zone,
  sales_end_date timestamp with time zone,
  is_active boolean DEFAULT true,
  min_quantity_per_purchase integer DEFAULT 1,
  max_quantity_per_purchase integer DEFAULT 10,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_sales (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  ticket_type_id uuid NOT NULL REFERENCES public.ticket_types(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  platform_fee numeric(10,2) NOT NULL,
  payment_processing_fee numeric(10,2) NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  payment_status text DEFAULT 'pending',
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  buyer_phone text,
  buyer_document text,
  created_at timestamp with time zone DEFAULT now(),
  paid_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  refunded_at timestamp with time zone,
  validated_at timestamp with time zone,
  validated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.organizer_payouts (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  gross_amount numeric DEFAULT 0 NOT NULL,
  platform_fee numeric DEFAULT 0 NOT NULL,
  processing_fee numeric DEFAULT 0 NOT NULL,
  net_amount numeric DEFAULT 0 NOT NULL,
  payout_due_date timestamp with time zone NOT NULL,
  payout_status text DEFAULT 'pending' NOT NULL,
  payout_date timestamp with time zone,
  payout_notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_admin_reply boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  read boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_ticket_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved platform events" ON public.platform_events;
CREATE POLICY "Anyone can view approved platform events" ON public.platform_events FOR SELECT USING (approval_status = 'approved');

DROP POLICY IF EXISTS "Admins can manage platform events" ON public.platform_events;
CREATE POLICY "Admins can manage platform events" ON public.platform_events FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Organizers can view their claim requests" ON public.event_claim_requests;
CREATE POLICY "Organizers can view their claim requests" ON public.event_claim_requests FOR SELECT USING (
  organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Organizers can create claim requests" ON public.event_claim_requests;
CREATE POLICY "Organizers can create claim requests" ON public.event_claim_requests FOR INSERT WITH CHECK (
  organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Organizers can view their ticket settings" ON public.event_ticket_settings;
CREATE POLICY "Organizers can view their ticket settings" ON public.event_ticket_settings FOR SELECT USING (
  event_id IN (SELECT e.id FROM events e JOIN organizers o ON e.organizer_id = o.id WHERE o.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Organizers can manage their ticket settings" ON public.event_ticket_settings;
CREATE POLICY "Organizers can manage their ticket settings" ON public.event_ticket_settings FOR ALL USING (
  event_id IN (SELECT e.id FROM events e JOIN organizers o ON e.organizer_id = o.id WHERE o.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Anyone can view active ticket types" ON public.ticket_types;
CREATE POLICY "Anyone can view active ticket types" ON public.ticket_types FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Organizers can manage their ticket types" ON public.ticket_types;
CREATE POLICY "Organizers can manage their ticket types" ON public.ticket_types FOR ALL USING (
  event_id IN (SELECT e.id FROM events e JOIN organizers o ON e.organizer_id = o.id WHERE o.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view their ticket sales" ON public.ticket_sales;
CREATE POLICY "Users can view their ticket sales" ON public.ticket_sales FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Organizers can view sales for their events" ON public.ticket_sales;
CREATE POLICY "Organizers can view sales for their events" ON public.ticket_sales FOR SELECT USING (
  event_id IN (SELECT e.id FROM events e JOIN organizers o ON e.organizer_id = o.id WHERE o.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Organizers can view their payouts" ON public.organizer_payouts;
CREATE POLICY "Organizers can view their payouts" ON public.organizer_payouts FOR SELECT USING (
  organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view their support messages" ON public.support_messages;
CREATE POLICY "Users can view their support messages" ON public.support_messages FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create support messages" ON public.support_messages;
CREATE POLICY "Users can create support messages" ON public.support_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);