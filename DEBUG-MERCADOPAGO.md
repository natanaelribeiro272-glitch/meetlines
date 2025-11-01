# Debug do Checkout Mercado Pago

## Passo 1: Verificar Logs no Supabase Dashboard

Para ver o erro exato que está acontecendo:

1. Acesse: https://supabase.com/dashboard/project/nsyaecxzjqruqkbnaael/functions/create-mercadopago-checkout/logs

2. Tente fazer uma compra no site

3. Observe os logs em tempo real - você verá mensagens começando com `[MercadoPago]`

4. Procure por:
   - `[MercadoPago] Access token exists: false` - significa que o token não foi configurado
   - `[MercadoPago] API Error:` - erro na API do Mercado Pago
   - Qualquer outra mensagem de erro

## Passo 2: Verificar Configuração do Token

1. Vá em: https://supabase.com/dashboard/project/nsyaecxzjqruqkbnaael/settings/functions

2. Procure por `MERCADOPAGO_ACCESS_TOKEN`

3. O valor deve ser: `APP_USR-609146451596611-103120-357024b17ebff8c085f7937fda27cfae-245284612`

4. Certifique-se de que está aplicado às functions:
   - `create-mercadopago-checkout`
   - `mercadopago-webhook`

## Passo 3: Testar Novamente

1. Recarregue a página do evento
2. Tente comprar um ingresso
3. Escolha "Pagamento instantâneo" (PIX)
4. Clique em "Finalizar Compra"

## Mensagens de Log Esperadas

Se tudo estiver OK, você verá esta sequência nos logs:

```
[MercadoPago] Starting checkout process
[MercadoPago] Access token exists: true
[MercadoPago] Access token length: 82
[MercadoPago] Getting user
[MercadoPago] User authenticated: [user-id]
[MercadoPago] Fetching ticket type
[MercadoPago] Ticket type found: [nome-do-ingresso]
[MercadoPago] Creating ticket sale record
[MercadoPago] Ticket sale created: [id]
[MercadoPago] Creating preference
[MercadoPago] API Response status: 201
[MercadoPago] Preference created: [preference-id]
[MercadoPago] Success! Returning URL: https://www.mercadopago.com.br/...
```

## Erros Comuns

### Erro: "Access token not configured"
**Solução**: Configure o `MERCADOPAGO_ACCESS_TOKEN` no Supabase

### Erro: "API Response status: 401"
**Solução**: O Access Token está incorreto ou expirado

### Erro: "API Response status: 400"
**Solução**: Há um problema nos dados enviados para o Mercado Pago. Verifique:
- O valor do ingresso não pode ser 0
- O email do comprador é válido
- Os dados do item estão corretos

### Erro: "Tipo de ingresso não encontrado"
**Solução**: O ID do ingresso não existe no banco de dados

## Verificar no Console do Navegador

Abra o DevTools (F12) e vá na aba Console. Você verá logs como:

```
[TicketPurchase] Starting checkout process
[TicketPurchase] Selected tickets: [...]
[TicketPurchase] Invoking function with: {...}
[TicketPurchase] Full response: {...}
```

Se houver erro, o último log mostrará o erro exato.

## Próximos Passos

Após verificar os logs acima, me informe:

1. O que aparece em `[MercadoPago] Access token exists`?
2. Qual é o status code da resposta da API? (`[MercadoPago] API Response status`)
3. Há alguma mensagem de erro específica?

Com essas informações, poderei corrigir o problema exato.
