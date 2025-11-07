/*
  # Criar tabela de ingressos individuais
  
  Esta migration cria a tabela `tickets` que armazena os ingressos individuais 
  gerados para cada venda. Cada ingresso representa um ticket único com QR Code 
  próprio que pode ser validado individualmente no evento.
  
  ## 1. Nova Tabela
  
  ### `tickets`
  - `id` (uuid, primary key) - Identificador único do ingresso
  - `ticket_sale_id` (uuid, foreign key) - Referência à venda que gerou este ingresso
  - `event_id` (uuid, foreign key) - Evento ao qual o ingresso pertence
  - `user_id` (uuid, foreign key) - Comprador/proprietário do ingresso
  - `ticket_type_id` (uuid, foreign key) - Tipo de ingresso comprado
  - `status` (text) - Status do ingresso: 'valid', 'used', 'cancelled', 'refunded'
  - `qr_code` (text, nullable) - Código QR único do ingresso (gerado automaticamente)
  - `validated_at` (timestamp, nullable) - Data/hora da validação (quando usado)
  - `validated_by` (uuid, nullable) - Usuário que validou o ingresso
  - `created_at` (timestamp) - Data de criação
  - `updated_at` (timestamp) - Data de atualização
  
  ## 2. Segurança
  
  - RLS habilitado na tabela
  - Usuários podem ver apenas seus próprios ingressos
  - Organizadores podem ver ingressos de seus eventos
  - Validadores podem atualizar status dos ingressos
  
  ## 3. Índices
  
  - Índice em `ticket_sale_id` para consultas rápidas por venda
  - Índice em `event_id` para consultas por evento
  - Índice em `user_id` para consultas por usuário
  - Índice em `qr_code` para validação rápida
  
  ## 4. Notas Importantes
  
  - Cada ingresso é gerado automaticamente após confirmação de pagamento
  - O QR Code é gerado com base no ID do ingresso
  - Status 'valid' indica que o ingresso pode ser usado
  - Status 'used' indica que o ingresso já foi validado no evento
  - Status 'cancelled' ou 'refunded' invalida o ingresso
*/

-- Criar tabela de ingressos individuais
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  ticket_sale_id uuid NOT NULL REFERENCES public.ticket_sales(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_type_id uuid NOT NULL REFERENCES public.ticket_types(id) ON DELETE CASCADE,
  status text DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'refunded')),
  qr_code text,
  validated_at timestamp with time zone,
  validated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Usuários podem ver seus próprios ingressos
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
CREATE POLICY "Users can view their own tickets" 
  ON public.tickets 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Políticas RLS: Organizadores podem ver ingressos de seus eventos
DROP POLICY IF EXISTS "Organizers can view tickets for their events" ON public.tickets;
CREATE POLICY "Organizers can view tickets for their events" 
  ON public.tickets 
  FOR SELECT 
  USING (
    event_id IN (
      SELECT e.id 
      FROM public.events e
      JOIN public.organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- Políticas RLS: Organizadores podem atualizar ingressos de seus eventos (para validação)
DROP POLICY IF EXISTS "Organizers can update tickets for their events" ON public.tickets;
CREATE POLICY "Organizers can update tickets for their events" 
  ON public.tickets 
  FOR UPDATE 
  USING (
    event_id IN (
      SELECT e.id 
      FROM public.events e
      JOIN public.organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_sale_id ON public.tickets(ticket_sale_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON public.tickets(qr_code);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar QR code automaticamente ao criar ingresso
CREATE OR REPLACE FUNCTION generate_ticket_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code := 'TICKET-' || NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ticket_qr_code ON public.tickets;
CREATE TRIGGER set_ticket_qr_code
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_qr_code();