# 🔑 Guia de Permissões - OpenAI API Key

## ⚠️ Problema Identificado

As API Keys da OpenAI podem ter diferentes níveis de permissão. Uma chave configurada apenas para **leitura** não funcionará para nossa aplicação.

## ✅ Permissões Necessárias

Para a funcionalidade de geração automática de eventos funcionar, a API Key precisa ter permissão **completa** (Read + Write).

### Ao Criar a Chave

Quando você cria uma nova API Key na OpenAI:

1. Acesse: https://platform.openai.com/api-keys
2. Clique em: **"Create new secret key"**
3. **Nome**: Ex: "Meetlines Production"
4. **Permissions** (Permissões):
   - ✅ **All** (Todas) - RECOMENDADO
   - Ou selecione: **Model capabilities** com permissão de **Write**
5. Clique em: **"Create secret key"**
6. Copie a chave gerada

## 🔍 Diferenças Entre Permissões

### Read Only (Somente Leitura) ❌
- Permite apenas consultar informações
- NÃO permite fazer chamadas para a API de Chat/Completions
- Resulta em erro 403 ou 401

### All / Write (Completa) ✅
- Permite fazer chamadas para a API
- Permite usar models como GPT-4o-mini
- Permite gerar texto, análises, etc
- **É o que precisamos!**

## 🔄 Se Você Já Tinha uma Chave Read Only

### Opção 1: Criar Nova Chave (Recomendado)

1. Acesse: https://platform.openai.com/api-keys
2. Clique em: **"Create new secret key"**
3. Configure com permissões **All**
4. Copie a nova chave
5. Atualize no Supabase:
   - Dashboard → Edge Functions → Secrets
   - Edite `OPENAI_API_KEY` com a nova chave
   - Ou delete a antiga e crie uma nova

### Opção 2: Editar Permissões da Chave Existente

⚠️ **ATENÇÃO**: A OpenAI não permite editar permissões de chaves existentes.
Você precisa criar uma nova chave.

## 📋 Checklist de Configuração Correta

- [ ] API Key criada com permissões **All** ou **Write**
- [ ] Chave adicionada no Supabase (Edge Functions → Secrets)
- [ ] Nome da secret: `OPENAI_API_KEY`
- [ ] Aguardado 2-3 minutos após atualizar
- [ ] Testado a busca de eventos
- [ ] Verificado que funciona ✅

## 🎯 Como Testar Agora

1. **Acesse a interface** de geração de eventos
2. **Digite**:
   - Cidade: São Paulo
   - Termo: shows
3. **Clique**: Buscar e Criar Eventos
4. **Resultado esperado**:
   ```
   ✓ "5 evento(s) encontrado(s) e criado(s) com sucesso!"
   ✓ Redirecionamento para eventos pendentes
   ```

## 🐛 Se Ainda Houver Erro

### Verificar os Logs

1. Dashboard Supabase → Edge Functions → Logs
2. Selecione: `search-events-by-city`
3. Execute a busca
4. Procure por:
   ```
   OPENAI_API_KEY presente: true ✓
   ```

### Erros Possíveis

**Erro 401 - Unauthorized:**
- Chave inválida ou expirada
- Solução: Criar nova chave

**Erro 403 - Forbidden:**
- Permissões insuficientes (Read Only)
- Solução: Criar nova chave com permissões All

**Erro 429 - Rate Limit:**
- Muitas requisições
- Solução: Aguardar alguns minutos

**Erro 429 - Insufficient Quota:**
- Sem créditos na conta
- Solução: Adicionar créditos em https://platform.openai.com/usage

## 💰 Custos e Limites

### Modelo Usado: GPT-4o-mini

- **Custo**: ~$0.01 por busca
- **Tokens**: ~2000-3000 por requisição
- **Limite gratuito**: $5 (se for conta nova)
- **Após limite**: Precisa adicionar billing

### Como Adicionar Créditos

1. Acesse: https://platform.openai.com/settings/organization/billing
2. Clique em: **"Add payment method"**
3. Configure cartão de crédito
4. Defina limite mensal (ex: $10/mês)

## ✅ Confirmação de Sucesso

Você saberá que está funcionando quando:

1. ✅ Busca retorna eventos
2. ✅ Eventos aparecem na lista de pendentes
3. ✅ Cada evento tem:
   - Título
   - Data e horário
   - Local
   - Descrição (mínimo 100 caracteres)
   - Categoria
   - Preço
   - URL (quando disponível)

## 🎉 Pronto!

Agora com a chave configurada com permissões corretas, a funcionalidade de geração automática de eventos deve funcionar perfeitamente!

---

**Última atualização**: 2025-11-07
**Versão**: 1.1 - Adicionado guia de permissões
