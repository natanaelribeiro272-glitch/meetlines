# Auto End Events Function

Esta função encerra automaticamente eventos que atingiram seu horário de encerramento programado.

## Como funciona

1. Verifica eventos que têm `end_date` definido
2. Compara o `end_date` com a hora atual
3. Encerra eventos (muda status para 'completed' e is_live para false) que passaram do horário

## Configuração do Cron Job

Para executar esta função automaticamente, você precisa configurar um cron job no Supabase:

### 1. Habilitar extensões no SQL Editor

```sql
-- Habilitar pg_cron
create extension if not exists pg_cron with schema extensions;

-- Habilitar pg_net
create extension if not exists pg_net with schema extensions;
```

### 2. Criar o cron job

Execute este SQL para criar um cron job que roda a cada 5 minutos:

```sql
select
  cron.schedule(
    'auto-end-events',
    '*/5 * * * *', -- A cada 5 minutos
    $$
    select
      net.http_post(
          url:='https://nsyaecxzjqruqkbnaael.supabase.co/functions/v1/auto-end-events',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
          body:=concat('{"time": "', now(), '"}')::jsonb
      ) as request_id;
    $$
  );
```

**IMPORTANTE**: Substitua `YOUR_ANON_KEY` pela chave anônima do seu projeto Supabase.

### 3. Verificar cron jobs ativos

```sql
select * from cron.job;
```

### 4. Deletar um cron job (se necessário)

```sql
select cron.unschedule('auto-end-events');
```

## Testando manualmente

Você pode testar a função manualmente fazendo uma requisição HTTP:

```bash
curl -X POST 'https://nsyaecxzjqruqkbnaael.supabase.co/functions/v1/auto-end-events' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

## Logs

A função registra logs detalhados que podem ser visualizados no painel do Supabase em:
Functions > auto-end-events > Logs
