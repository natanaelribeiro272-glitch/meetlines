# 🔍 Debug - Configuração OpenAI API Key

## Erro Atual

Você está recebendo um erro 500 ao tentar buscar eventos, o que indica que há um problema na configuração ou na função Edge Function.

## ✅ Passos para Resolver

### Passo 1: Verificar se a API Key está configurada corretamente

1. **Acesse o Dashboard do Supabase:**
   - URL: https://supabase.com/dashboard/project/nsyaecxzjqruqkbnaael

2. **Vá para Edge Functions → Secrets:**
   - Menu lateral esquerdo: **Edge Functions**
   - Clique em **Secrets** (ou **Environment Variables**)

3. **Verifique se existe:**
   - Nome: `OPENAI_API_KEY`
   - Status: Deve mostrar como configurado (não mostra o valor por segurança)

4. **Se NÃO existir ou estiver errado:**
   - Clique em **"Add a new secret"** ou **"New secret"**
   - Nome: `OPENAI_API_KEY` (exatamente assim, em maiúsculas)
   - Value: Cole sua chave da OpenAI (começa com `sk-`)
   - Clique em **Save** ou **Add**

### Passo 2: Aguardar Propagação

⏱️ **IMPORTANTE**: Após adicionar/atualizar a secret, aguarde 2-3 minutos para que ela seja propagada para as Edge Functions.

### Passo 3: Verificar os Logs Detalhados

1. **Acesse os Logs da Edge Function:**
   - Dashboard do Supabase → **Edge Functions** → **Logs**
   - Ou: https://supabase.com/dashboard/project/nsyaecxzjqruqkbnaael/functions

2. **Selecione a função:** `search-events-by-city`

3. **Execute um novo teste** na interface

4. **Veja os logs em tempo real:**
   - Procure por: `"=== Iniciando busca de eventos por cidade ==="`
   - Verifique: `"OPENAI_API_KEY presente: true"` ou `"OPENAI_API_KEY presente: false"`

### Passo 4: Deploy da Função Atualizada

A função foi atualizada com logs mais detalhados. Para garantir que está usando a versão mais recente:

1. **No Dashboard do Supabase:**
   - Vá em: **Edge Functions**
   - Encontre: `search-events-by-city`
   - Verifique a data do último deploy

2. **Se necessário, faça redeploy:**
   - As funções devem ser automaticamente atualizadas
   - Se o erro persistir após 5 minutos, pode ser necessário redeployar

## 🔑 Como Obter uma Nova API Key da OpenAI

Se você ainda não tem ou precisa de uma nova:

1. **Acesse:** https://platform.openai.com/api-keys
2. **Faça login** na sua conta OpenAI
3. **Clique em:** "Create new secret key"
4. **Dê um nome:** ex: "Meetlines Production"
5. **Copie a chave** (começa com `sk-`)
   - ⚠️ **ATENÇÃO**: A chave só é mostrada UMA VEZ
   - Salve em local seguro antes de fechar

6. **Verifique créditos:**
   - Acesse: https://platform.openai.com/usage
   - Confirme que tem créditos disponíveis
   - Se for conta nova, pode ter $5 de crédito gratuito

## 📊 Verificação dos Logs Detalhados

Com a função atualizada, você verá logs como:

```
=== Iniciando busca de eventos por cidade ===
Cidade: São Paulo
Query: shows
Verificando variáveis de ambiente...
OPENAI_API_KEY presente: true
SERPAPI_API_KEY presente: false
Buscando: shows São Paulo
```

### Se a API Key NÃO está presente:
```
=== Iniciando busca de eventos por cidade ===
Cidade: São Paulo
Query: shows
Verificando variáveis de ambiente...
OPENAI_API_KEY presente: false
ERRO: OPENAI_API_KEY não está configurada!
Configure em: Supabase Dashboard → Edge Functions → Secrets
```

## 🚨 Erros Comuns e Soluções

### Erro 1: "OPENAI_API_KEY não configurada"
**Causa**: A chave não foi adicionada ou o nome está errado
**Solução**:
- Nome deve ser exatamente: `OPENAI_API_KEY` (maiúsculas)
- Não use espaços antes ou depois
- Aguarde 2-3 minutos após adicionar

### Erro 2: "Unauthorized" ou "Invalid API Key"
**Causa**: Chave inválida ou expirada
**Solução**:
- Verifique se copiou a chave completa (começa com `sk-`)
- Confirme em: https://platform.openai.com/api-keys
- Se necessário, crie uma nova chave

### Erro 3: "Insufficient quota"
**Causa**: Sem créditos na conta OpenAI
**Solução**:
- Verifique em: https://platform.openai.com/usage
- Adicione créditos ou configure billing
- Contas novas têm $5 grátis (pode ter expirado)

### Erro 4: Função retorna 500 sem detalhes
**Causa**: Erro na execução da função
**Solução**:
1. Aguarde 3-5 minutos após adicionar a secret
2. Limpe o cache do navegador (Ctrl+Shift+R)
3. Verifique os logs detalhados no Supabase
4. Tente novamente

## 📝 Checklist de Verificação

Execute este checklist na ordem:

- [ ] **Passo 1**: API Key criada em https://platform.openai.com/api-keys
- [ ] **Passo 2**: API Key adicionada no Supabase (Edge Functions → Secrets)
- [ ] **Passo 3**: Nome da secret é exatamente `OPENAI_API_KEY`
- [ ] **Passo 4**: Aguardado 2-3 minutos após adicionar
- [ ] **Passo 5**: Verificado que tem créditos em https://platform.openai.com/usage
- [ ] **Passo 6**: Testado busca na interface
- [ ] **Passo 7**: Verificado logs no Supabase Dashboard
- [ ] **Passo 8**: Se logs mostram "OPENAI_API_KEY presente: false", voltar ao Passo 2

## 🎯 Teste Rápido

Após configurar tudo, teste com:

1. **Cidade**: São Paulo
2. **Termo**: (deixar vazio)
3. **Clicar**: Buscar e Criar Eventos

**Resultado esperado:**
- ✅ "X evento(s) encontrado(s) e criado(s) com sucesso!"
- ✅ Redirecionamento para eventos pendentes

**Se ainda der erro:**
1. Abra o console do navegador (F12)
2. Copie o erro completo
3. Verifique os logs no Supabase Dashboard
4. Compartilhe os logs para análise mais detalhada

## 🔄 Processo de Deploy das Edge Functions

As Edge Functions são deployadas automaticamente quando você salva alterações nos arquivos. Se precisar forçar um redeploy:

**Opção 1: Via Dashboard (Recomendado)**
- Acesse: Edge Functions no Dashboard
- Encontre: `search-events-by-city`
- Clique em: **Deploy** ou **Redeploy**

**Opção 2: Via CLI (Avançado)**
```bash
# Se tiver o Supabase CLI configurado
npx supabase functions deploy search-events-by-city
```

## 📞 Próximos Passos

1. **Siga o checklist acima**
2. **Verifique os logs no Supabase**
3. **Teste novamente após 2-3 minutos**
4. **Se persistir, compartilhe os logs do console**

---

**Última atualização**: 2025-11-07
**Versão**: 1.0
