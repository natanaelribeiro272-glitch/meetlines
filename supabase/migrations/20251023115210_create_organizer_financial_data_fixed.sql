/*
  # Sistema de Dados Financeiros do Organizador

  1. Nova Tabela: `organizer_financial_data`
    - Armazena informações bancárias e fiscais do organizador
    - Suporta tanto CPF quanto CNPJ
    - Dados bancários completos para repasse
    - Informações de contato fiscal

  2. Nova Tabela: `ticket_sales_transactions`
    - Registra todas as transações de vendas de ingressos
    - Rastreamento de status de pagamento e repasse
    - Histórico completo de vendas

  3. Segurança
    - RLS habilitado em todas as tabelas
    - Organizadores só veem seus próprios dados
    - Admins podem visualizar para auditoria
*/

-- Tipo de documento fiscal
DO $$ BEGIN
  CREATE TYPE document_type AS ENUM ('cpf', 'cnpj');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tipo de conta bancária
DO $$ BEGIN
  CREATE TYPE bank_account_type AS ENUM ('corrente', 'poupanca');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Status de transação
DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela de dados financeiros do organizador
CREATE TABLE IF NOT EXISTS organizer_financial_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  
  -- Dados Fiscais
  document_type document_type NOT NULL,
  document_number text NOT NULL,
  legal_name text NOT NULL,
  trading_name text,
  
  -- Endereço Fiscal
  zip_code text NOT NULL,
  street text NOT NULL,
  number text NOT NULL,
  complement text,
  neighborhood text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  country text DEFAULT 'Brasil',
  
  -- Dados Bancários
  bank_code text NOT NULL,
  bank_name text NOT NULL,
  account_type bank_account_type NOT NULL,
  agency text NOT NULL,
  agency_digit text,
  account_number text NOT NULL,
  account_digit text NOT NULL,
  
  -- Dados de Contato
  phone text NOT NULL,
  email text NOT NULL,
  
  -- Configurações
  auto_transfer boolean DEFAULT false,
  transfer_day integer DEFAULT 5 CHECK (transfer_day >= 1 AND transfer_day <= 28),
  
  -- Validação e Status
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id),
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar constraint único se não existir
DO $$ BEGIN
  ALTER TABLE organizer_financial_data ADD CONSTRAINT organizer_financial_data_organizer_id_key UNIQUE(organizer_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela de transações de vendas de ingressos
CREATE TABLE IF NOT EXISTS ticket_sales_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  ticket_sale_id uuid NOT NULL REFERENCES ticket_sales(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Valores
  gross_amount decimal(10,2) NOT NULL CHECK (gross_amount >= 0),
  platform_fee decimal(10,2) NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
  payment_gateway_fee decimal(10,2) NOT NULL DEFAULT 0 CHECK (payment_gateway_fee >= 0),
  net_amount decimal(10,2) NOT NULL CHECK (net_amount >= 0),
  
  -- Status
  transaction_status transaction_status DEFAULT 'pending',
  payment_date timestamptz,
  transfer_date timestamptz,
  transfer_scheduled_date timestamptz,
  
  -- Referências Externas
  payment_id text,
  transfer_id text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_organizer_financial_data_organizer ON organizer_financial_data(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organizer_financial_data_document ON organizer_financial_data(document_number);
CREATE INDEX IF NOT EXISTS idx_ticket_sales_transactions_organizer ON ticket_sales_transactions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_sales_transactions_event ON ticket_sales_transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_sales_transactions_status ON ticket_sales_transactions(transaction_status);
CREATE INDEX IF NOT EXISTS idx_ticket_sales_transactions_dates ON ticket_sales_transactions(payment_date, transfer_date);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_organizer_financial_data_updated_at ON organizer_financial_data;
CREATE TRIGGER update_organizer_financial_data_updated_at
  BEFORE UPDATE ON organizer_financial_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ticket_sales_transactions_updated_at ON ticket_sales_transactions;
CREATE TRIGGER update_ticket_sales_transactions_updated_at
  BEFORE UPDATE ON ticket_sales_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE organizer_financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_sales_transactions ENABLE ROW LEVEL SECURITY;

-- Policies para organizer_financial_data
DROP POLICY IF EXISTS "Organizers can view own financial data" ON organizer_financial_data;
CREATE POLICY "Organizers can view own financial data"
  ON organizer_financial_data
  FOR SELECT
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organizers can insert own financial data" ON organizer_financial_data;
CREATE POLICY "Organizers can insert own financial data"
  ON organizer_financial_data
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organizers can update own financial data" ON organizer_financial_data;
CREATE POLICY "Organizers can update own financial data"
  ON organizer_financial_data
  FOR UPDATE
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all financial data" ON organizer_financial_data;
CREATE POLICY "Admins can view all financial data"
  ON organizer_financial_data
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update verification status" ON organizer_financial_data;
CREATE POLICY "Admins can update verification status"
  ON organizer_financial_data
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policies para ticket_sales_transactions
DROP POLICY IF EXISTS "Organizers can view own transactions" ON ticket_sales_transactions;
CREATE POLICY "Organizers can view own transactions"
  ON ticket_sales_transactions
  FOR SELECT
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert transactions" ON ticket_sales_transactions;
CREATE POLICY "System can insert transactions"
  ON ticket_sales_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all transactions" ON ticket_sales_transactions;
CREATE POLICY "Admins can view all transactions"
  ON ticket_sales_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update transactions" ON ticket_sales_transactions;
CREATE POLICY "Admins can update transactions"
  ON ticket_sales_transactions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
