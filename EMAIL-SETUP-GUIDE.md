# Guia de Configuração de Email - Brevo (Sendinblue)

Este guia explica como configurar o envio de emails de confirmação usando a API Brevo.

## Por que usar Brevo em vez do email padrão do Supabase?

O Supabase usa um serviço de email padrão que pode ter limitações e problemas com links de confirmação. O Brevo oferece:

- ✅ Maior taxa de entrega
- ✅ Emails personalizados e profissionais
- ✅ 300 emails/dia grátis (plano gratuito)
- ✅ Analytics e logs detalhados
- ✅ Suporte a domínios customizados
- ✅ Interface em português

## Passo 1: Criar conta no Brevo

1. Acesse: https://www.brevo.com/pt/
2. Clique em "Inscrever-se gratuitamente"
3. Preencha seus dados e crie sua conta
4. Confirme seu email

## Passo 2: Obter API Key

1. Faça login no Brevo
2. Acesse: https://app.brevo.com/settings/keys/api
3. Clique em "Criar uma nova chave de API"
4. Dê um nome (ex: "Meetlines Emails")
5. Clique em "Gerar"
6. **IMPORTANTE**: Copie a API key (começa com `xkeysib-`) - você só verá ela uma vez!

## Passo 3: Configurar remetente

1. Acesse: https://app.brevo.com/senders
2. Clique em "Adicionar um remetente"
3. Preencha os dados:
   - **Nome**: Meetlines
   - **Email**: Use um email que você tem acesso (ex: noreply@seudominio.com)
4. Clique em "Adicionar"
5. Confirme o email que o Brevo enviará para você

### Para usar domínio próprio (recomendado para produção):

1. Acesse: https://app.brevo.com/settings/domains
2. Clique em "Adicionar um domínio"
3. Digite seu domínio (ex: `meetlines.app`)
4. Adicione os registros DNS fornecidos pelo Brevo no seu provedor de DNS:
   - Registro DKIM (TXT)
   - Registro SPF (TXT)
5. Aguarde a verificação (pode levar alguns minutos)

### Para desenvolvimento/testes:

- Você pode usar qualquer email verificado
- O plano gratuito permite 300 emails/dia
- Perfeito para desenvolvimento e testes

## Passo 4: Configurar no Supabase

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Project Settings** → **Edge Functions** → **Secrets**
4. Clique em "Add secret"
5. Adicione:
   - **Name**: `BREVO_API_KEY`
   - **Value**: Cole sua API key do Brevo (ex: `xkeysib-123abc...`)
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

3. Na seção **SMTP Settings** (opcional - não necessário se usar Brevo):
   - Você pode deixar em branco, pois estamos usando Brevo via Edge Function

## Passo 7: Atualizar email remetente na Edge Function

Se você quiser usar um email diferente de `noreply@meetlines.app`:

1. Abra o arquivo: `supabase/functions/send-email-confirmation/index.ts`
2. Localize a linha com `sender`:
   ```typescript
   sender: {
     name: "Meetlines",
     email: "noreply@meetlines.app"
   },
   ```
3. Altere para o email que você verificou no Brevo

## Passo 8: Testar o sistema

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

### Logs no Brevo:
1. Acesse: https://app.brevo.com/log
2. Veja todos os emails enviados
3. Status de entrega
4. Taxa de abertura e cliques
5. Estatísticas detalhadas

### Logs no Supabase:
1. Vá em **Edge Functions** → `send-email-confirmation` → **Logs**
2. Veja erros e debug
3. Monitore execuções

## Solução de Problemas

### Email não está chegando:

1. **Verifique a API key**:
   - Confirme que está configurada no Supabase Edge Functions Secrets
   - Verifique se não tem espaços extras

2. **Verifique o remetente**:
   - Confirme que o email remetente está verificado no Brevo
   - Se usar domínio próprio, confirme que os registros DNS estão corretos

3. **Verifique spam/lixo eletrônico**:
   - Emails de desenvolvimento podem ir para spam
   - Domínio próprio verificado reduz isso drasticamente

4. **Verifique os logs**:
   - Logs da Edge Function no Supabase
   - Logs de envio no dashboard do Brevo

### Erro "BREVO_API_KEY não configurada":

1. Vá em Supabase → Edge Functions → Secrets
2. Adicione `BREVO_API_KEY` com sua API key
3. Faça redeploy da function se necessário

### Erro "Sender not verified":

1. Vá em Brevo → Senders
2. Verifique se o email remetente foi confirmado
3. Clique em "Reenviar email de verificação" se necessário

### Link de confirmação não funciona:

1. Verifique se a URL do Supabase está correta no código
2. Confirme que o token está sendo passado corretamente
3. Verifique se a função está pegando o `access_token` correto

## Custos

**Brevo - Plano Gratuito:**
- 300 emails/dia grátis (9.000 emails/mês)
- Sem limite de contatos
- Perfeito para desenvolvimento e projetos pequenos
- Interface em português

**Planos Pagos:**
- A partir de €25/mês para 20.000 emails/mês
- Sem limite de emails diários
- Veja mais em: https://www.brevo.com/pt/pricing/

## Boas Práticas

1. ✅ Use domínio próprio em produção
2. ✅ Monitore taxa de entrega regularmente
3. ✅ Teste emails em diferentes clientes (Gmail, Outlook, etc.)
4. ✅ Mantenha o design responsivo para mobile
5. ✅ Adicione link de texto além do botão
6. ✅ Use HTTPS para todos os links
7. ✅ Não envie informações sensíveis por email

## Recursos Úteis

- [Documentação Brevo](https://developers.brevo.com/)
- [API de Email Transacional](https://developers.brevo.com/reference/sendtransacemail)
- [Verificação de domínio](https://help.brevo.com/hc/pt/articles/209467485)
- [Melhores práticas de email](https://help.brevo.com/hc/pt/sections/4409247833234)

## Suporte

Se tiver problemas:
1. Verifique os logs no Supabase e Brevo
2. Consulte a documentação oficial em português
3. Entre em contato com o suporte do Brevo (suporte em português disponível!)

---

**Última atualização**: Outubro 2025
