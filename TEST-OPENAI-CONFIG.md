# 🧪 Teste da Configuração OpenAI

## Como Testar

### 1. Acesse a Interface de Geração de Eventos

1. Faça login como administrador na plataforma
2. Vá para: **Menu Admin** → **Gerar Eventos Automaticamente**
3. Você verá a interface principal de busca

### 2. Execute um Teste Simples

**Teste Básico:**
- **Cidade**: São Paulo
- **Termo**: shows
- Clique em: **Buscar e Criar Eventos**

### 3. Resultados Esperados

#### ✅ Se a API Key está configurada corretamente:
```
✓ Toast de sucesso: "X evento(s) encontrado(s) e criado(s) com sucesso!"
✓ Redirecionamento automático para página de eventos pendentes
✓ Eventos aparecem na lista com status "pendente"
```

#### ❌ Se a API Key NÃO está configurada:
```
✗ Toast de erro: "Configuração necessária: OPENAI_API_KEY não está configurada no Supabase"
✗ Descrição: "Configure em: Dashboard → Edge Functions → Secrets"
```

## 🔍 Verificação Manual no Supabase

### Via Dashboard:

1. Acesse: https://supabase.com/dashboard/project/nsyaecxzjqruqkbnaael
2. Menu lateral: **Edge Functions** → **Secrets**
3. Procure por: `OPENAI_API_KEY`
4. Status deve mostrar: ✓ Configurado

### Via Logs (em caso de erro):

1. No Supabase Dashboard: **Edge Functions** → **Logs**
2. Selecione a função: `search-events-by-city`
3. Execute o teste de busca
4. Verifique os logs para erros detalhados

## 🐛 Erros Comuns e Soluções

### Erro 1: "OPENAI_API_KEY não configurada"
**Causa**: A chave não foi adicionada ou não está acessível
**Solução**:
1. Confirme que adicionou em: Dashboard → Edge Functions → Secrets
2. Nome deve ser exatamente: `OPENAI_API_KEY` (maiúsculas)
3. Aguarde 1-2 minutos após adicionar (pode levar um tempo para propagar)

### Erro 2: "Erro na OpenAI: 401 Unauthorized"
**Causa**: Chave inválida ou expirada
**Solução**:
1. Verifique se copiou a chave completa (começa com `sk-`)
2. Confirme que a chave está ativa em: https://platform.openai.com/api-keys
3. Verifique se tem créditos disponíveis em: https://platform.openai.com/usage

### Erro 3: "Erro na OpenAI: 429 Too Many Requests"
**Causa**: Limite de requisições excedido
**Solução**:
1. Aguarde alguns minutos antes de tentar novamente
2. Verifique seu plano em: https://platform.openai.com/usage
3. Considere upgrade se necessário

### Erro 4: "Nenhum evento encontrado"
**Causa**: Busca não retornou resultados válidos
**Solução**:
1. Tente uma cidade maior (ex: São Paulo, Rio de Janeiro)
2. Use termos mais genéricos (ex: "eventos" ao invés de algo muito específico)
3. Deixe o campo "Termo de Busca" vazio para buscar tudo
4. Verifique se a cidade foi digitada corretamente

## 📊 Teste de Validação Completo

Execute estes testes em sequência:

### Teste 1: Cidade Grande - Termo Genérico
```
Cidade: São Paulo
Termo: eventos
Resultado Esperado: 3-5 eventos encontrados
```

### Teste 2: Cidade Média - Termo Específico
```
Cidade: Belo Horizonte
Termo: shows
Resultado Esperado: 1-5 eventos encontrados
```

### Teste 3: Usando Exemplos Pré-definidos
```
Clique no botão: "Shows de Rock em São Paulo"
Resultado Esperado: Campos preenchidos automaticamente e busca executada
```

### Teste 4: Campo Vazio
```
Cidade: Rio de Janeiro
Termo: (deixar vazio)
Resultado Esperado: Todos os tipos de eventos encontrados
```

## ✅ Checklist de Verificação

- [ ] API Key da OpenAI criada em: https://platform.openai.com/api-keys
- [ ] API Key adicionada no Supabase: Dashboard → Edge Functions → Secrets
- [ ] Nome da secret: `OPENAI_API_KEY` (exatamente assim)
- [ ] Aguardado 1-2 minutos após adicionar a secret
- [ ] Conta OpenAI tem créditos disponíveis
- [ ] Testado busca por cidade com sucesso
- [ ] Eventos aparecem como "pendentes" para revisão

## 🎯 Próximos Passos Após Sucesso

1. **Revisar Eventos Criados**
   - Acesse: Admin → Eventos Pendentes
   - Verifique a qualidade dos dados extraídos
   - Edite informações se necessário

2. **Aprovar Eventos**
   - Clique em cada evento pendente
   - Revise título, data, local, descrição
   - Clique em "Aprovar" para publicar

3. **Usar Regularmente**
   - Execute buscas para diferentes cidades
   - Varie os termos de busca
   - Mantenha a plataforma atualizada com eventos

## 💡 Dicas para Melhores Resultados

1. **Cidades**: Use nomes completos (ex: "São Paulo" ao invés de "SP")
2. **Termos**: Seja específico mas não excessivo (ex: "shows" ao invés de "shows de rock indie alternativo")
3. **Frequência**: Faça buscas regulares para manter eventos atualizados
4. **Revisão**: Sempre revise os eventos antes de aprovar
5. **SerpAPI**: Para resultados ainda melhores, configure também a SERPAPI_API_KEY

## 📞 Suporte

Se após seguir todos os passos ainda houver problemas:
1. Capture screenshot do erro exato
2. Verifique os logs no Supabase Dashboard
3. Confirme status da conta OpenAI
4. Entre em contato com suporte técnico

---

**Última atualização**: 2025-11-07
**Versão do guia**: 1.0
