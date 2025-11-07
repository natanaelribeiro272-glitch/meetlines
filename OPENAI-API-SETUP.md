# Configuração da API Key OpenAI para Geração Automática de Eventos

Este guia explica como configurar a OpenAI API Key necessária para a funcionalidade de geração automática de eventos.

## 📋 Pré-requisitos

1. Conta no Supabase (já configurada)
2. Conta na OpenAI (https://platform.openai.com)

## 🔑 Passo 1: Obter a API Key da OpenAI

1. Acesse: https://platform.openai.com/api-keys
2. Faça login na sua conta OpenAI
3. Clique em **"Create new secret key"**
4. Dê um nome para a chave (ex: "Meetlines Events")
5. Copie a chave gerada (começa com `sk-`)
   - ⚠️ **IMPORTANTE**: Guarde esta chave em local seguro, ela só é mostrada uma vez!

## 🔧 Passo 2: Configurar no Supabase

### Opção A: Via Dashboard do Supabase (Recomendado)

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto: **nsyaecxzjqruqkbnaael**
3. No menu lateral, vá em: **Edge Functions** → **Secrets**
4. Clique em **"Add a new secret"**
5. Preencha:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Cole a chave da OpenAI que você copiou
6. Clique em **"Add secret"**

### Opção B: Via CLI do Supabase (Avançado)

```bash
npx supabase secrets set OPENAI_API_KEY=sk-sua-chave-aqui
```

## 🌐 Passo 3: (Opcional) Configurar SerpAPI para Melhores Resultados

Para resultados mais precisos e estruturados, você pode configurar a SerpAPI:

1. Acesse: https://serpapi.com
2. Crie uma conta gratuita (100 buscas/mês grátis)
3. Copie sua API Key
4. Configure no Supabase da mesma forma:
   - **Name**: `SERPAPI_API_KEY`
   - **Value**: Sua chave da SerpAPI

## ✅ Verificar Configuração

1. Acesse a área administrativa da plataforma
2. Vá em: **Admin** → **Gerar Eventos Automaticamente**
3. Insira uma cidade e termo de busca
4. Clique em **"Buscar e Criar Eventos"**
5. Se configurado corretamente, os eventos serão criados

## 🎯 Como Usar a Funcionalidade

### Busca Simples
- **Cidade**: São Paulo
- **Termo**: _(deixar vazio)_
- Resultado: Busca todos os tipos de eventos em São Paulo

### Busca Específica
- **Cidade**: Rio de Janeiro
- **Termo**: shows de rock
- Resultado: Busca apenas shows de rock no Rio de Janeiro

### Exemplos Prontos
A interface já fornece 4 exemplos de busca que você pode usar com um clique:
- Shows de Rock em São Paulo
- Festas no Rio de Janeiro
- Teatro em Belo Horizonte
- Todos os Eventos em Porto Alegre

## 🤖 Como Funciona

1. **Busca Inteligente**: A IA realiza uma busca no Google pelos eventos na cidade especificada
2. **Análise Automática**: Os resultados são analisados e as informações são extraídas:
   - Título do evento
   - Data e horário
   - Local específico
   - Preço (ou gratuito)
   - Categoria
   - URL oficial (quando disponível)
3. **Criação Automática**: Até 5 eventos são criados com status "pendente"
4. **Revisão**: Você pode revisar e editar cada evento antes de publicá-lo
5. **Publicação**: Após aprovação, os eventos ficam visíveis na plataforma

## 💰 Custos

### OpenAI
- Modelo usado: **gpt-4o-mini**
- Custo estimado: ~$0.01 por busca
- Você pode monitorar o uso em: https://platform.openai.com/usage

### SerpAPI (Opcional)
- Plano gratuito: 100 buscas/mês
- Custo adicional: A partir de $50/mês para 5.000 buscas
- Veja planos em: https://serpapi.com/pricing

## 🔒 Segurança

- ✅ As API Keys ficam armazenadas de forma segura no Supabase
- ✅ Nunca são expostas no frontend
- ✅ Apenas Edge Functions têm acesso às chaves
- ✅ Você deve ser administrador para usar esta funcionalidade

## 🐛 Troubleshooting

### Erro: "OPENAI_API_KEY não configurada"
**Solução**: Configure a chave seguindo o Passo 2 acima

### Erro: "Nenhum evento encontrado"
**Possíveis causas**:
- Cidade digitada incorretamente
- Termo de busca muito específico
- Não há eventos futuros para aquela busca

**Solução**: Tente:
- Verificar a ortografia da cidade
- Usar um termo mais genérico
- Deixar o termo em branco
- Tentar outra cidade

### Erro na API da OpenAI
**Solução**:
- Verifique se tem créditos disponíveis na conta OpenAI
- Confirme que a API Key está correta
- Acesse https://platform.openai.com/usage para ver o status

## 📞 Suporte

Se precisar de ajuda adicional:
1. Verifique os logs no Dashboard do Supabase: **Edge Functions** → **Logs**
2. Entre em contato com o suporte técnico

## 🎉 Pronto!

Agora você pode gerar eventos automaticamente para qualquer cidade do Brasil usando IA!
