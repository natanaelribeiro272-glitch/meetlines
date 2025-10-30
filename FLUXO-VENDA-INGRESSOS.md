# Fluxo Completo de Venda de Ingressos

## Resumo das Correções Implementadas

### 1. Adicionada coluna `has_platform_tickets` na tabela `events`
- Esta flag indica se o evento vende ingressos diretamente pela plataforma
- Permite filtrar e exibir corretamente os eventos com venda de ingressos

### 2. Validação de Stripe Connect
- Organizador PRECISA ter conta Stripe Connect configurada antes de vender ingressos
- Sistema verifica `stripe_account_id` e `stripe_charges_enabled = true`
- Alertas visuais no componente TicketConfiguration caso Stripe não esteja conectado

### 3. Correções no fluxo de criação de eventos
- Flag `has_platform_tickets` é definida automaticamente quando organizador escolhe vender pela plataforma
- Validação adicional antes de salvar o evento
- Tipos de ingressos são carregados corretamente na página do evento

## Fluxo para o Organizador

### Passo 1: Conectar Stripe Connect
1. Acessar **Perfil do Organizador** → **Configurações**
2. Encontrar o card "Pagamentos via Stripe"
3. Clicar em **"Conectar com Stripe"**
4. Será redirecionado para formulário do Stripe
5. Preencher:
   - Dados pessoais ou empresariais
   - Informações bancárias (para receber os pagamentos)
   - Documentos necessários (CPF/CNPJ, comprovante de endereço)
6. Aguardar aprovação do Stripe (pode levar alguns minutos)
7. Status será atualizado automaticamente para **"Ativo"**

### Passo 2: Criar Evento com Venda de Ingressos
1. Acessar **Criar Evento**
2. Preencher informações básicas (título, descrição, data, local)
3. Na seção **"Capacidade e Ingressos"**, selecionar:
   - 💳 **Vender pela plataforma**
4. Se Stripe não estiver conectado, um alerta aparecerá com botão para conectar
5. Configurar **tipos de ingressos/lotes**:
   - Nome (ex: "1º Lote", "VIP", "Pista")
   - Descrição
   - Preço
   - Quantidade disponível
   - Período de vendas (opcional)
   - Quantidade mínima/máxima por compra
6. Configurar **taxas**:
   - Escolher quem paga as taxas (comprador ou organizador)
   - Taxa da plataforma: 5%
   - Taxa de processamento: 3.99% + R$ 0.39
7. Aceitar os **termos e condições**
8. Clicar em **"Criar Evento"**

### Passo 3: Gerenciar Vendas
1. Acessar o evento criado
2. Ver vendas em tempo real
3. Receber pagamentos automaticamente na conta bancária cadastrada no Stripe
4. Tempo de transferência: 2-7 dias úteis após o pagamento

## Fluxo para o Usuário (Comprador)

### Passo 1: Encontrar Evento
1. Navegar pelo feed de eventos
2. Clicar no evento desejado

### Passo 2: Comprar Ingresso
1. Verificar se o evento tem o botão **"💳 Comprar Ingresso"**
2. Clicar no botão de compra
3. Selecionar tipo de ingresso e quantidade
4. Revisar o valor total (incluindo taxas, se aplicável)
5. Clicar em **"Finalizar Compra"**

### Passo 3: Pagamento no Stripe
1. Será redirecionado para página segura do Stripe
2. Inserir dados do cartão de crédito:
   - Número do cartão
   - Data de validade
   - CVV
   - CEP de cobrança
3. Confirmar o pagamento

### Passo 4: Receber Ingresso
1. Após pagamento aprovado, será redirecionado de volta para a plataforma
2. Visualizar **QR Code do ingresso**
3. Ver detalhes da compra:
   - Tipo de ingresso
   - Quantidade
   - Data e local do evento
   - Valor pago
4. Opções disponíveis:
   - **Imprimir ingresso**
   - Salvar QR Code (screenshot)

### Passo 5: Apresentar no Evento
1. Levar o ingresso (impresso ou digital)
2. Organizador escaneia o QR Code na entrada
3. Ingresso é validado e entrada liberada

## Requisitos Técnicos para Funcionamento Completo

### 1. Variáveis de Ambiente no Supabase
Acessar: **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**

Adicionar:
- `STRIPE_SECRET_KEY` - Chave secreta do Stripe (sk_test_... ou sk_live_...)
- `STRIPE_WEBHOOK_SECRET` - Secret do webhook (whsec_...)

### 2. Configurar Webhook no Stripe
Acessar: **Stripe Dashboard** → **Developers** → **Webhooks**

Criar endpoint:
- **URL**: `https://[SEU-PROJECT-ID].supabase.co/functions/v1/stripe-webhook`
- **Eventos**:
  - `account.updated`
  - `checkout.session.completed`
  - `checkout.session.expired`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`

### 3. Habilitar Stripe Connect
Acessar: **Stripe Dashboard** → **Connect**
- Clicar em **Get started**
- Escolher **Platform** como tipo
- Configurar branding da plataforma

### 4. Edge Functions Deployadas
Verificar no **Supabase Dashboard** → **Edge Functions** que estão ativas:
- `create-ticket-checkout`
- `stripe-webhook`
- `create-stripe-connect-account`
- `check-stripe-connect-status`
- `verify-ticket-payment`

## Testes com Cartões de Teste

Para testar em modo desenvolvimento, use:

**Cartão de sucesso:**
- Número: `4242 4242 4242 4242`
- Data: Qualquer data futura
- CVC: Qualquer 3 dígitos
- CEP: Qualquer valor

**Cartão que requer autenticação:**
- Número: `4000 0025 0000 3155`

**Cartão que falha:**
- Número: `4000 0000 0000 9995`

## Verificação do Sistema

### Checklist - Organizador pode vender?
- [ ] Stripe Connect habilitado no dashboard do Stripe
- [ ] Variáveis STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET configuradas
- [ ] Webhook criado e ativo no Stripe
- [ ] Edge Functions deployadas no Supabase
- [ ] Organizador conectou conta Stripe (stripe_charges_enabled = true)
- [ ] Evento criado com has_platform_tickets = true
- [ ] Tipos de ingressos cadastrados na tabela ticket_types

### Checklist - Usuário pode comprar?
- [ ] Botão "Comprar Ingresso" aparece na página do evento
- [ ] Clicar no botão abre o TicketPurchaseDialog
- [ ] Selecionar ingresso e clicar em "Finalizar Compra" redireciona para Stripe
- [ ] Pagamento é processado no Stripe
- [ ] Webhook atualiza status do pagamento para "completed"
- [ ] Usuário é redirecionado para página de sucesso com QR Code

## Solução de Problemas Comuns

### "Conecte sua conta Stripe antes de vender ingressos"
**Causa**: Organizador não completou onboarding do Stripe
**Solução**: Acessar perfil → Configurações → Conectar com Stripe

### "Botão de compra não aparece no evento"
**Causa**: Flag has_platform_tickets não foi definida ou não há tipos de ingressos
**Solução**: Verificar no banco se evento tem has_platform_tickets = true e ticket_types cadastrados

### "Erro ao processar compra"
**Causa**: Organizador não tem stripe_charges_enabled = true
**Solução**: Organizador precisa completar verificação no Stripe

### "Pagamento não é confirmado após compra"
**Causa**: Webhook não está funcionando
**Solução**:
1. Verificar se STRIPE_WEBHOOK_SECRET está configurado
2. Ver logs do webhook no Stripe Dashboard
3. Ver logs da Edge Function stripe-webhook no Supabase

## Próximos Passos para Produção

1. **Ativar conta Stripe em modo Live**
   - Fornecer informações bancárias
   - Completar verificação de identidade

2. **Atualizar chaves para produção**
   - Obter chaves Live (sk_live_...)
   - Atualizar STRIPE_SECRET_KEY no Supabase

3. **Criar webhook de produção**
   - Usar mesma URL
   - Obter novo webhook secret de produção
   - Atualizar STRIPE_WEBHOOK_SECRET

4. **Testar com valores reais baixos**
   - Fazer compra de teste com cartão real
   - Verificar se transferência chega na conta

## Recursos Adicionais

- [Documentação Stripe Connect](https://stripe.com/docs/connect)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- Guias no projeto:
  - `STRIPE-SETUP-GUIDE.md`
  - `STRIPE-CONNECT-SETUP.md`
