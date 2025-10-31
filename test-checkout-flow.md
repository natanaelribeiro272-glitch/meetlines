# Teste do Fluxo de Checkout de Ingressos

## ✅ Verificações Realizadas

### 1. Edge Function `create-ticket-checkout`
- ✅ Removido todo Stripe Connect
- ✅ Usa sua conta Stripe diretamente
- ✅ Suporta STRIPE_PRODUCT_ID (opcional)
- ✅ Cria registro em ticket_sales antes do checkout
- ✅ Retorna URL do Stripe Checkout

### 2. Frontend `TicketPurchaseDialog`
- ✅ Interface de seleção de ingressos
- ✅ Chama função corretamente
- ✅ Redireciona para Stripe Checkout
- ✅ Logs detalhados no console

### 3. Webhook `stripe-webhook`
- ✅ Processa checkout.session.completed
- ✅ Atualiza status em ticket_sales
- ✅ Incrementa quantity_sold

### 4. Página de Sucesso
- ✅ Rota /ticket-success configurada
- ✅ Busca dados do ingresso
- ✅ Exibe QR Code

### 5. Banco de Dados
- ✅ Eventos com has_platform_tickets=true existem
- ✅ Ticket types configurados
- ✅ Tabela ticket_sales pronta

## 📋 Passo a Passo para Testar

### 1. Configure as variáveis no Supabase
```
STRIPE_SECRET_KEY=sk_test_... (sua chave)
STRIPE_WEBHOOK_SECRET=whsec_... (do webhook)
STRIPE_PRODUCT_ID=prod_... (OPCIONAL - ID do seu produto)
```

### 2. Teste o Fluxo
1. Acesse um evento com `has_platform_tickets = true`
2. Clique em "Comprar Ingresso"
3. Selecione quantidade
4. Clique em "Finalizar Compra"
5. **Verifique o console do navegador** para logs detalhados

### 3. O que deve acontecer
```
[EventDetails] Buy ticket button clicked
[EventDetails] Ticket settings: {...}
[EventDetails] Ticket types: [...]
[EventDetails] Opening ticket dialog
[TicketPurchase] Starting checkout process
[TicketPurchase] Selected tickets: [...]
[TicketPurchase] Invoking function with: {...}
[TicketPurchase] Full response: {...}
[TicketPurchase] Response data: {url: "https://checkout.stripe.com/...", sessionId: "..."}
[TicketPurchase] Redirecting to: https://checkout.stripe.com/...
```

### 4. Após pagamento no Stripe
- Webhook processa pagamento
- Status muda para "completed"
- quantity_sold incrementa
- Redireciona para /ticket-success
- Exibe QR Code do ingresso

## 🐛 Se houver erro

### Erro: "No authorization header provided"
- Usuário não está logado
- Fazer login primeiro

### Erro: "Ticket type not found"
- Verificar se ticket_type_id existe
- Verificar se está ativo (is_active=true)

### Erro: Nenhum URL retornado
- Verificar logs da Edge Function no Supabase
- Dashboard → Edge Functions → create-ticket-checkout → Logs

### Erro na criação do registro ticket_sales
- Verificar RLS policies
- Usuário precisa ter permissão de INSERT

## ✅ Checklist Final

- [ ] STRIPE_SECRET_KEY configurado no Supabase
- [ ] STRIPE_WEBHOOK_SECRET configurado no Supabase
- [ ] STRIPE_PRODUCT_ID configurado (opcional)
- [ ] Webhook configurado no Stripe Dashboard
- [ ] Evento tem has_platform_tickets = true
- [ ] Evento tem ticket_types criados
- [ ] ticket_types estão ativos (is_active = true)
- [ ] Usuário está autenticado
- [ ] Console do navegador aberto para ver logs

## 🎯 Resultado Esperado

Quando tudo estiver correto:
1. Botão "Comprar Ingresso" aparece no evento
2. Dialog abre mostrando os tipos de ingresso
3. Ao clicar "Finalizar Compra", redireciona para Stripe
4. Após pagamento, volta para /ticket-success
5. QR Code é exibido com sucesso
