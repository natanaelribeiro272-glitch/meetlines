# Guia de Configuração do Stripe Connect - Pagamentos de Ingressos

Este guia explica como configurar o Stripe Connect para permitir que organizadores recebam pagamentos diretamente nas suas contas bancárias.

## O que é Stripe Connect?

Stripe Connect permite que sua plataforma facilite pagamentos entre compradores e organizadores. Com o Connect:

- Cada organizador tem sua própria conta Stripe
- Pagamentos vão diretamente para a conta do organizador
- A plataforma cobra automaticamente uma taxa de serviço
- Organizadores recebem transferências automáticas para suas contas bancárias

## Pré-requisitos

- Conta no Stripe (criar em https://dashboard.stripe.com/register)
- Projeto Supabase configurado
- Acesso ao dashboard do Supabase

## Arquitetura do Sistema

### Fluxo de Pagamento

1. **Usuário compra ingresso** → Checkout Stripe
2. **Pagamento processado** → Valor total cobrado do comprador
3. **Taxa da plataforma descontada** → Automaticamente pelo Stripe
4. **Valor restante transferido** → Diretamente para conta do organizador
5. **Webhook atualiza status** → Banco de dados atualizado

### Exemplo de Cálculo

- Ingresso: R$ 100,00
- Taxa da plataforma: 10% = R$ 10,00
- Taxa de processamento: 3.99% + R$ 0,39 = R$ 4,38
- **Total cobrado do comprador**: R$ 114,38
- **Plataforma recebe**: R$ 14,38 (taxas)
- **Organizador recebe**: R$ 100,00

## Passo 1: Configurar Stripe para Connect

### 1.1 Habilitar Stripe Connect

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com)
2. Vá em **Connect** no menu lateral
3. Clique em **Get started**
4. Escolha **Platform** como tipo de conta
5. Complete as informações da sua plataforma

### 1.2 Configurar Branding

1. Em **Connect** → **Settings**
2. Configure:
   - Nome da plataforma
   - Logo
   - Cores da marca
   - URL do site
3. Essas informações aparecerão no processo de onboarding dos organizadores

### 1.3 Obter Chaves de API

1. Vá em **Developers** → **API keys**
2. Você verá:
   - **Publishable key** (pk_test_... ou pk_live_...)
   - **Secret key** (sk_test_... ou sk_live_...)

⚠️ **IMPORTANTE**: Use chaves de teste durante desenvolvimento

## Passo 2: Configurar Variáveis de Ambiente no Supabase

### 2.1 Adicionar Chave Secreta

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Project Settings** → **Edge Functions** → **Secrets**
4. Adicione:
   - **Name**: `STRIPE_SECRET_KEY`
   - **Value**: Sua Secret key do Stripe (sk_test_... ou sk_live_...)

## Passo 3: Configurar Webhooks

### 3.1 Criar Endpoint de Webhook

1. Dashboard do Stripe → **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. Configure:
   - **Endpoint URL**: `https://nsyaecxzjqruqkbnaael.supabase.co/functions/v1/stripe-webhook`
   - **Description**: "Platform webhook for tickets and connect events"

4. Selecione estes eventos:

   **Para Stripe Connect:**
   - `account.updated` - Atualiza status da conta do organizador
   - `account.application.deauthorized` - Quando organizador desconecta

   **Para Pagamentos:**
   - `checkout.session.completed` - Pagamento concluído
   - `checkout.session.expired` - Sessão expirou
   - `payment_intent.succeeded` - Pagamento bem-sucedido
   - `payment_intent.payment_failed` - Pagamento falhou
   - `charge.refunded` - Reembolso processado

5. Clique em **Add endpoint**

### 3.2 Configurar Webhook Secret

1. Clique no webhook criado
2. Na seção **Signing secret**, clique em **Reveal**
3. Copie o valor (começa com `whsec_`)
4. No Supabase, adicione:
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: O webhook secret copiado

## Passo 4: Configurar URLs de Retorno

As URLs de retorno já estão configuradas nas Edge Functions:

- **Success URL**: `/organizer-profile?stripe_success=true`
- **Refresh URL**: `/organizer-profile?stripe_refresh=true`

Essas URLs são usadas após o onboarding do Stripe.

## Passo 5: Implantar Edge Functions

Certifique-se de que estas Edge Functions estão implantadas:

### Funções Necessárias

1. **create-stripe-connect-account**
   - Cria conta Stripe Connect para organizador
   - Gera link de onboarding

2. **check-stripe-connect-status**
   - Verifica status da conta do organizador
   - Atualiza capabilities no banco

3. **create-ticket-checkout**
   - Cria sessão de checkout com Connect
   - Aplica taxa da plataforma automaticamente

4. **stripe-webhook**
   - Recebe notificações do Stripe
   - Atualiza status de contas e pagamentos

## Passo 6: Configurar Taxas da Plataforma

As taxas são configuradas na tabela `event_ticket_settings`:

```sql
platform_fee_percentage: 10.00 (10%)
payment_processing_fee_percentage: 3.99 (3.99%)
payment_processing_fee_fixed: 0.39 (R$ 0.39)
fee_payer: 'buyer' ou 'organizer'
```

## Como Funciona para o Organizador

### 1. Processo de Onboarding

1. Organizador acessa **Configurações** no painel
2. Vê card "Pagamentos via Stripe"
3. Clica em "Conectar com Stripe"
4. É redirecionado para formulário do Stripe
5. Preenche informações:
   - Dados pessoais ou empresariais
   - Informações bancárias
   - Documentos necessários
6. Stripe valida as informações
7. Conta é ativada (pode levar alguns minutos)

### 2. Verificação Necessária

O Stripe pode solicitar:
- **Pessoa Física**: CPF, RG, comprovante de residência
- **Pessoa Jurídica**: CNPJ, contrato social, documentos dos sócios
- **Conta Bancária**: Dados para transferência

### 3. Status da Conta

O sistema rastreia:
- `stripe_onboarding_completed` - Onboarding completo
- `stripe_charges_enabled` - Pode aceitar pagamentos
- `stripe_payouts_enabled` - Pode receber transferências
- `stripe_account_status` - Status geral (pending/active)

## Como Funciona para o Comprador

1. Comprador seleciona ingressos
2. Clica em "Finalizar Compra"
3. É redirecionado para checkout Stripe
4. Insere dados do cartão
5. Confirma pagamento
6. Recebe QR Code do ingresso
7. Pagamento processado:
   - Valor total debitado do cartão
   - Taxa da plataforma retida
   - Valor líquido transferido ao organizador

## Teste do Sistema

### 1. Testar Onboarding

1. Crie uma conta de organizador no sistema
2. Acesse Configurações
3. Clique em "Conectar com Stripe"
4. Use dados de teste do Stripe
5. Complete o processo

### 2. Testar Compra de Ingresso

**Cartões de teste:**

- **Sucesso**: `4242 4242 4242 4242`
- **Requer autenticação**: `4000 0025 0000 3155`
- **Falha**: `4000 0000 0000 9995`

**Dados do cartão:**
- Data: Qualquer data futura
- CVC: Qualquer 3 dígitos
- CEP: Qualquer valor

### 3. Verificar no Dashboard

**Dashboard do Stripe:**
- **Payments**: Ver transações
- **Connect**: Ver contas conectadas
- **Webhooks**: Verificar eventos recebidos

**Dashboard do Supabase:**
- **Edge Functions** → **Logs**: Ver execuções
- Verificar updates na tabela `organizers`
- Verificar updates na tabela `ticket_sales`

## Modo Produção

### Checklist para Go Live

- [ ] Completar verificação da conta Stripe
- [ ] Fornecer informações bancárias
- [ ] Ativar modo Live no Stripe
- [ ] Atualizar `STRIPE_SECRET_KEY` com chave `sk_live_...`
- [ ] Criar novo webhook para produção
- [ ] Atualizar `STRIPE_WEBHOOK_SECRET` com secret de produção
- [ ] Testar com valores reais baixos
- [ ] Verificar transferências estão funcionando
- [ ] Configurar alertas de erros

### Compliance e Legal

- Termos de serviço claros
- Política de reembolso definida
- Taxa da plataforma transparente
- Acordo com organizadores sobre taxas
- Conformidade com regulações locais

## Taxas do Stripe

### Brasil

**Stripe Checkout:**
- 4.49% + R$ 0,50 por transação bem-sucedida

**Stripe Connect:**
- 0.25% adicional por transação em conta conectada
- Taxas de transferência podem variar

**Custos Totais Estimados:**
- Stripe: ~4.74% + R$ 0,50
- Plataforma: Definido por você (sugerido 10%)

## Solução de Problemas

### Erro: "Organizador não configurou pagamentos"

- Organizador precisa completar onboarding Stripe
- Verificar se `stripe_charges_enabled` = true
- Organizador pode clicar em "Atualizar Status"

### Webhook não está funcionando

- Verificar se URL está correta
- Confirmar `STRIPE_WEBHOOK_SECRET` está configurado
- Ver logs no Stripe Dashboard → Webhooks
- Ver logs no Supabase Edge Functions

### Pagamento não é confirmado

- Verificar webhook `checkout.session.completed`
- Ver logs da função `stripe-webhook`
- Verificar se evento foi recebido no Stripe Dashboard

### Organizador não recebe transferência

- Verificar se `stripe_payouts_enabled` = true
- Confirmar dados bancários estão corretos
- Verificar saldo no Stripe Dashboard
- Transferências podem levar 2-7 dias úteis

## Fluxo de Fundos

### Timeline

1. **T+0**: Comprador paga
2. **T+0**: Taxa da plataforma separada
3. **T+2**: Stripe disponibiliza fundos
4. **T+2 a T+7**: Transferência bancária ao organizador

### Onde Ver os Valores

**Dashboard do Stripe:**
- **Balance**: Ver saldo disponível e pendente
- **Transfers**: Ver transferências para organizadores
- **Application fees**: Ver taxas da plataforma coletadas

## Recursos Adicionais

- [Documentação Stripe Connect](https://stripe.com/docs/connect)
- [Testing Stripe Connect](https://stripe.com/docs/connect/testing)
- [Connect Best Practices](https://stripe.com/docs/connect/best-practices)
- [Webhooks Guide](https://stripe.com/docs/webhooks)

## Suporte

Se encontrar problemas:

1. Verifique logs das Edge Functions
2. Verifique eventos do webhook no Stripe
3. Consulte documentação oficial
4. Verifique se todas as variáveis estão configuradas
5. Teste em modo desenvolvimento primeiro
