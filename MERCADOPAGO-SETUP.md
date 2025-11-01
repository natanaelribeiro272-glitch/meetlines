# Configuração do Mercado Pago

Este guia explica como configurar o Mercado Pago para processar pagamentos via PIX no MeetLines.

## 1. Obter Credenciais do Mercado Pago

1. Acesse o [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel)
2. Faça login com sua conta Mercado Pago
3. Vá em **Suas integrações** → **Credenciais**
4. Você verá duas credenciais importantes:
   - **Public Key** (começa com `APP_USR-`)
   - **Access Token** (começa com `APP_USR-`)

## 2. Configurar no Supabase

### Variáveis de Ambiente (Edge Functions)

O `MERCADOPAGO_ACCESS_TOKEN` precisa ser configurado como uma **variável de ambiente secreta** no Supabase:

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Project Settings** → **Edge Functions** → **Environment Variables**
4. Adicione uma nova variável:
   - **Name**: `MERCADOPAGO_ACCESS_TOKEN`
   - **Value**: Seu Access Token do Mercado Pago (começa com `APP_USR-`)
   - **Apply to**: Selecione todas as functions ou apenas `create-mercadopago-checkout` e `mercadopago-webhook`

### Public Key no Frontend

A Public Key já está configurada no arquivo `.env`:

```env
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-e7611fbd-c81b-4b5c-ac94-d281b372a4e4
```

## 3. Configurar Webhook

Para receber notificações de pagamento:

1. No [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel)
2. Vá em **Webhooks** → **Notificações IPN**
3. Configure a URL de notificação:
   ```
   https://nsyaecxzjqruqkbnaael.supabase.co/functions/v1/mercadopago-webhook
   ```
4. Eventos a serem notificados: **Pagamentos**

## 4. Testar Integração

### Modo de Teste

1. Use as credenciais de **teste** do Mercado Pago
2. Acesse: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test
3. Use os [cartões de teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards)

### Modo de Produção

1. Troque as credenciais de teste pelas credenciais de **produção**
2. Atualize as variáveis de ambiente no Supabase
3. Certifique-se de que sua conta Mercado Pago está ativa e verificada

## 5. Verificar Configuração

Para verificar se tudo está configurado corretamente:

1. Acesse um evento com ingressos pagos
2. Tente comprar um ingresso
3. Selecione "Pagamento instantâneo" (PIX)
4. Se a configuração estiver correta, você será redirecionado para o Mercado Pago

## Problemas Comuns

### Erro: "Sistema de pagamento Mercado Pago não configurado"

- **Causa**: `MERCADOPAGO_ACCESS_TOKEN` não está configurado no Supabase
- **Solução**: Siga o passo 2 acima para configurar a variável de ambiente

### Erro: "Edge Function returned a non-2xx status code"

- **Causa**: Erro na Edge Function (pode ser credenciais inválidas)
- **Solução**:
  1. Verifique se o Access Token está correto
  2. Certifique-se de que está usando credenciais de produção (não teste)
  3. Verifique os logs da Edge Function no Supabase

### Webhook não está funcionando

- **Causa**: URL do webhook não configurada ou incorreta
- **Solução**:
  1. Verifique a URL do webhook no Mercado Pago
  2. Certifique-se de que está usando a URL correta da Edge Function
  3. Teste o webhook manualmente

## Recursos Adicionais

- [Documentação Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [Checkout API](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/landing)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/your-integrations/notifications/webhooks)
