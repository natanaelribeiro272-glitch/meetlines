# Guia de Configuração de Email - Resend

Este guia explica como configurar o envio de emails de confirmação usando a API Resend.

## Por que usar Resend em vez do email padrão do Supabase?

O Supabase usa um serviço de email padrão que pode ter limitações e problemas com links de confirmação. O Resend oferece:

- ✅ Maior taxa de entrega
- ✅ Emails personalizados e profissionais
- ✅ Melhor reputação de domínio
- ✅ Analytics e logs detalhados
- ✅ Suporte a domínios customizados

## Passo 1: Criar conta no Resend

1. Acesse: https://resend.com
2. Clique em "Sign Up" e crie sua conta
3. Confirme seu email

## Passo 2: Obter API Key

1. Acesse: https://resend.com/api-keys
2. Clique em "Create API Key"
3. Dê um nome (ex: "Meetlines Production")
4. Selecione as permissões: **Sending access**
5. Clique em "Create"
6. **IMPORTANTE**: Copie a API key (começa com `re_`) - você só verá ela uma vez!

## Passo 3: (Opcional) Configurar domínio customizado

### Para usar domínio próprio (recomendado para produção):

1. Acesse: https://resend.com/domains
2. Clique em "Add Domain"
3. Digite seu domínio (ex: `meetlines.app`)
4. Adicione os registros DNS fornecidos pelo Resend no seu provedor de DNS:
   - Registro SPF (TXT)
   - Registro DKIM (TXT)
   - Registro de verificação (TXT)
5. Aguarde a verificação (pode levar alguns minutos)

### Para desenvolvimento/testes:

- Você pode usar o domínio de teste do Resend
- Emails serão enviados de: `onboarding@resend.dev`
- Bom para testes, mas use domínio próprio em produção

## Passo 4: Configurar no Supabase

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Project Settings** → **Edge Functions** → **Secrets**
4. Clique em "Add secret"
5. Adicione:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Cole sua API key do Resend (ex: `re_123abc...`)
6. Clique em "Save"

## Passo 5: Deploy da Edge Function

A edge function `send-email-confirmation` já está criada. Para fazer o deploy:

```bash
# Se você tiver o Supabase CLI instalado localmente
npx supabase functions deploy send-email-confirmation

# Ou use a ferramenta de deploy do seu projeto
```

## Passo 6: Configurar Authentication no Supabase

1. No Dashboard do Supabase, vá em **Authentication** → **Settings**
2. Na seção **Email Auth**:
   - **Enable email confirmations**: DESABILITE esta opção
   - Isso permite que o sistema use emails customizados

3. Na seção **SMTP Settings** (opcional - não necessário se usar Resend):
   - Você pode deixar em branco, pois estamos usando Resend via Edge Function

## Passo 7: Testar o sistema

1. Tente criar uma nova conta no aplicativo
2. Verifique se o email de confirmação chegou
3. Clique no link de confirmação
4. Verifique se a conta foi confirmada com sucesso

## Customização do Email

O template de email está em:
```
supabase/functions/send-email-confirmation/index.ts
```

Você pode personalizar:
- Design do email (HTML e CSS inline)
- Texto e mensagens
- Logo e branding
- Cores e estilos

### Dicas de customização:

1. **Adicionar logo**: Hospede sua logo em algum lugar (ex: Supabase Storage) e adicione:
   ```html
   <img src="URL_DA_SUA_LOGO" alt="Logo" style="width: 120px; margin-bottom: 20px;">
   ```

2. **Mudar cores**: Altere o gradient no CSS:
   ```css
   background: linear-gradient(135deg, #SUA_COR_1 0%, #SUA_COR_2 100%);
   ```

3. **Adicionar informações**: Adicione links para redes sociais, suporte, etc.

## Monitoramento

### Logs no Resend:
1. Acesse: https://resend.com/emails
2. Veja todos os emails enviados
3. Status de entrega
4. Taxa de abertura (se ativado)

### Logs no Supabase:
1. Vá em **Edge Functions** → `send-email-confirmation` → **Logs**
2. Veja erros e debug
3. Monitore execuções

## Solução de Problemas

### Email não está chegando:

1. **Verifique a API key**:
   - Confirme que está configurada no Supabase Edge Functions Secrets
   - Verifique se não tem espaços extras

2. **Verifique o domínio**:
   - Se usar domínio próprio, confirme que os registros DNS estão corretos
   - Use o domínio de teste do Resend para debugging

3. **Verifique spam/lixo eletrônico**:
   - Emails de desenvolvimento podem ir para spam
   - Domínio próprio verificado reduz isso drasticamente

4. **Verifique os logs**:
   - Logs da Edge Function no Supabase
   - Logs de envio no dashboard do Resend

### Erro "RESEND_API_KEY não configurada":

1. Vá em Supabase → Edge Functions → Secrets
2. Adicione `RESEND_API_KEY` com sua API key
3. Faça redeploy da function se necessário

### Link de confirmação não funciona:

1. Verifique se a URL do Supabase está correta no código
2. Confirme que o token está sendo passado corretamente
3. Verifique se a função está pegando o `access_token` correto

## Custos

**Resend - Plano Gratuito:**
- 3.000 emails/mês grátis
- 100 emails/dia
- Perfeito para desenvolvimento e projetos pequenos

**Planos Pagos:**
- A partir de $20/mês para 50.000 emails
- Veja mais em: https://resend.com/pricing

## Boas Práticas

1. ✅ Use domínio próprio em produção
2. ✅ Monitore taxa de entrega regularmente
3. ✅ Teste emails em diferentes clientes (Gmail, Outlook, etc.)
4. ✅ Mantenha o design responsivo para mobile
5. ✅ Adicione link de texto além do botão
6. ✅ Use HTTPS para todos os links
7. ✅ Não envie informações sensíveis por email

## Recursos Úteis

- [Documentação Resend](https://resend.com/docs)
- [Verificação de domínio](https://resend.com/docs/dashboard/domains/introduction)
- [Melhores práticas de email](https://resend.com/docs/knowledge-base/deliverability)
- [Templates de email](https://github.com/resend/email-templates)

## Suporte

Se tiver problemas:
1. Verifique os logs no Supabase e Resend
2. Consulte a documentação oficial
3. Entre em contato com o suporte do Resend (muito responsivo!)

---

**Última atualização**: Outubro 2025
