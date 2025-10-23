# Guia de Configuração do Stripe - Venda de Ingressos

Este guia detalha como configurar a integração do Stripe para venda de ingressos no seu projeto.

## Pré-requisitos

- Conta no Stripe (criar em https://dashboard.stripe.com/register)
- Projeto Supabase configurado
- Acesso ao dashboard do Supabase

## Passo 1: Obter Chaves de API do Stripe

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com)
2. Faça login na sua conta
3. No menu lateral, clique em **Developers** → **API keys**
4. Você verá duas chaves:
   - **Publishable key** (começa com `pk_test_` ou `pk_live_`)
   - **Secret key** (começa com `sk_test_` ou `sk_live_`)

⚠️ **IMPORTANTE**: Use chaves de teste (`_test_`) durante o desenvolvimento e chaves de produção (`_live_`) apenas quando estiver pronto para aceitar pagamentos reais.

## Passo 2: Configurar Variáveis de Ambiente no Supabase

### 2.1 Acessar Configurações do Projeto

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, vá em **Project Settings** → **Edge Functions**
4. Role até a seção **Secrets**

### 2.2 Adicionar Chave Secreta do Stripe

Clique em **Add new secret** e adicione:

- **Name**: `STRIPE_SECRET_KEY`
- **Value**: Cole aqui a sua Secret key do Stripe (sk_test_... ou sk_live_...)

## Passo 3: Configurar Webhook do Stripe

O webhook permite que o Stripe notifique automaticamente seu sistema quando um pagamento é concluído.

### 3.1 Criar Endpoint de Webhook

1. No Dashboard do Stripe, vá em **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. Configure:
   - **Endpoint URL**: `https://[SEU-PROJECT-ID].supabase.co/functions/v1/stripe-webhook`
   - Substitua `[SEU-PROJECT-ID]` pelo ID do seu projeto Supabase
4. Em **Events to send**, selecione:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Clique em **Add endpoint**

### 3.2 Obter Webhook Secret

Após criar o webhook:

1. Clique no webhook que você acabou de criar
2. Na seção **Signing secret**, clique em **Reveal** ou **Click to reveal**
3. Copie o valor (começa com `whsec_`)

### 3.3 Adicionar Webhook Secret no Supabase

Volte ao Supabase Dashboard:

1. Vá em **Project Settings** → **Edge Functions** → **Secrets**
2. Clique em **Add new secret**
3. Adicione:
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: Cole o webhook secret que você copiou

## Passo 4: Implantar Edge Functions

As Edge Functions precisam estar implantadas no Supabase. O sistema já possui as seguintes funções:

- `create-ticket-checkout` - Cria sessão de checkout no Stripe
- `verify-ticket-payment` - Verifica status do pagamento
- `stripe-webhook` - Recebe notificações do Stripe

Certifique-se de que todas estão implantadas e ativas no Dashboard do Supabase em **Edge Functions**.

## Passo 5: Testar a Integração

### 5.1 Usar Cartões de Teste do Stripe

Para testar em modo de desenvolvimento, use estes cartões de teste:

**Cartão de sucesso:**
- Número: `4242 4242 4242 4242`
- Data: Qualquer data futura
- CVC: Qualquer 3 dígitos
- CEP: Qualquer valor

**Cartão que requer autenticação:**
- Número: `4000 0025 0000 3155`

**Cartão que falha:**
- Número: `4000 0000 0000 9995`

Lista completa: https://stripe.com/docs/testing

### 5.2 Fluxo de Teste

1. Acesse seu aplicativo
2. Encontre um evento com venda de ingressos habilitada
3. Clique em "Comprar Ingresso"
4. Selecione quantidade e clique em "Finalizar Compra"
5. Você será redirecionado para a página de checkout do Stripe
6. Use um cartão de teste para completar a compra
7. Após sucesso, você será redirecionado de volta com o QR Code do ingresso

### 5.3 Verificar no Dashboard do Stripe

1. Acesse **Payments** no Dashboard do Stripe
2. Você deverá ver a transação de teste listada
3. Em **Webhooks**, verifique se os eventos estão sendo recebidos com sucesso

## Passo 6: Monitoramento

### Logs das Edge Functions

Para verificar se tudo está funcionando:

1. Vá no Dashboard do Supabase
2. Acesse **Edge Functions**
3. Clique na função desejada
4. Vá na aba **Logs**
5. Acompanhe os logs em tempo real durante os testes

### Logs do Webhook no Stripe

1. Dashboard do Stripe → **Developers** → **Webhooks**
2. Clique no seu webhook
3. Vá na aba **Events**
4. Verifique o status dos eventos enviados (deve mostrar "Success")

## Variáveis de Ambiente - Resumo

### Supabase Edge Functions Secrets (obrigatório)
- `STRIPE_SECRET_KEY` - Chave secreta do Stripe
- `STRIPE_WEBHOOK_SECRET` - Secret do webhook

### Supabase (já configuradas automaticamente)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Modo Produção

Quando estiver pronto para aceitar pagamentos reais:

1. No Dashboard do Stripe, ative sua conta (forneça informações bancárias, etc)
2. Vá em **Developers** → **API keys** e copie as chaves **LIVE** (não TEST)
3. Atualize as variáveis no Supabase com as chaves de produção:
   - Atualize `STRIPE_SECRET_KEY` com a chave `sk_live_...`
4. Configure um novo webhook para produção:
   - Use o mesmo endpoint URL
   - Obtenha o novo webhook secret de produção
   - Atualize `STRIPE_WEBHOOK_SECRET`
5. Teste com cartões reais em um valor baixo antes de ir ao ar

## Solução de Problemas

### Erro: "STRIPE_SECRET_KEY is not set"

- Verifique se adicionou a variável no Supabase Edge Functions → Secrets
- Certifique-se de que o nome está exatamente como `STRIPE_SECRET_KEY`
- Aguarde 1-2 minutos após adicionar para que a variável seja propagada

### Webhook não está funcionando

- Verifique se o endpoint URL está correto
- Confirme que o `STRIPE_WEBHOOK_SECRET` foi adicionado
- Verifique os logs do webhook no Dashboard do Stripe
- Verifique os logs da Edge Function no Supabase

### Pagamento não é confirmado

- Verifique se o webhook está recebendo o evento `checkout.session.completed`
- Confirme que a função `verify-ticket-payment` está sendo chamada
- Verifique os logs para identificar erros específicos

## Recursos Adicionais

- [Documentação do Stripe](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## Suporte

Se encontrar problemas:

1. Verifique os logs das Edge Functions no Supabase
2. Verifique os eventos do webhook no Stripe
3. Consulte a documentação oficial do Stripe e Supabase
4. Verifique se todas as variáveis de ambiente estão configuradas corretamente
