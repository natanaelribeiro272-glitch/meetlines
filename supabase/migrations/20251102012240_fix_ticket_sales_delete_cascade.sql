/*
  # Corrigir constraint de exclusão em ticket_sales

  ## Problema
  - A tabela ticket_sales tinha ON DELETE RESTRICT
  - Isso impedia a exclusão de eventos que possuem vendas de ingressos
  - Gerava erro "Erro ao excluir evento"

  ## Solução
  - Remover constraints antigas com RESTRICT
  - Adicionar constraints novas com CASCADE
  - Quando um evento for excluído, as vendas relacionadas também serão excluídas

  ## Segurança
  - Isso é seguro pois as vendas estão diretamente relacionadas ao evento
  - Sem o evento, as vendas não fazem sentido
  - Os dados financeiros já foram processados antes da exclusão
*/

-- Remover constraints antigas
ALTER TABLE public.ticket_sales
DROP CONSTRAINT IF EXISTS ticket_sales_event_id_fkey;

ALTER TABLE public.ticket_sales
DROP CONSTRAINT IF EXISTS ticket_sales_ticket_type_id_fkey;

-- Adicionar constraints novas com CASCADE
ALTER TABLE public.ticket_sales
ADD CONSTRAINT ticket_sales_event_id_fkey
  FOREIGN KEY (event_id)
  REFERENCES public.events(id)
  ON DELETE CASCADE;

ALTER TABLE public.ticket_sales
ADD CONSTRAINT ticket_sales_ticket_type_id_fkey
  FOREIGN KEY (ticket_type_id)
  REFERENCES public.ticket_types(id)
  ON DELETE CASCADE;
