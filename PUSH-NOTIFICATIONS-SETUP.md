# Configuração de Notificações Push

Este guia explica como configurar as notificações push no aplicativo usando Firebase Cloud Messaging (FCM) API V1 com OAuth 2.0.

## Visão Geral

O sistema de notificações push está implementado e pronto para uso. Ele enviará notificações automáticas para:

- ✅ Curtidas no perfil
- ✅ Solicitações de amizade
- ✅ Aceitação de solicitações de amizade
- ✅ Novas mensagens
- ✅ Novos eventos de organizadores seguidos

## Pré-requisitos

1. Conta no Firebase Console
2. App mobile compilado (Android/iOS)
3. Acesso ao painel do Supabase

## Passo 1: Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Dê um nome ao projeto (ex: "MeetLines")
4. Siga os passos de criação do projeto

## Passo 2: Configurar Android

### 2.1. Adicionar App Android no Firebase

1. No Firebase Console, clique no ícone do Android
2. Preencha o package name: `com.meetlines.app` (ou o seu package name)
3. Baixe o arquivo `google-services.json`
4. Coloque o arquivo em `android/app/google-services.json`

### 2.2. Atualizar build.gradle

Adicione no arquivo `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

Adicione no arquivo `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

## Passo 3: Configurar iOS

### 3.1. Adicionar App iOS no Firebase

1. No Firebase Console, clique no ícone do iOS
2. Preencha o Bundle ID: `com.meetlines.app` (ou o seu bundle ID)
3. Baixe o arquivo `GoogleService-Info.plist`
4. Abra o projeto no Xcode
5. Adicione o arquivo `GoogleService-Info.plist` ao projeto

### 3.2. Habilitar Push Notifications

1. No Xcode, selecione o target do app
2. Vá em "Signing & Capabilities"
3. Clique em "+ Capability"
4. Adicione "Push Notifications"
5. Adicione "Background Modes" e marque "Remote notifications"

### 3.3. Configurar APNs

1. Acesse [Apple Developer](https://developer.apple.com/)
2. Crie um APNs Key
3. No Firebase Console, vá em Project Settings > Cloud Messaging
4. Faça upload do APNs Key

## Passo 4: Obter Service Account JSON do Firebase

1. No Firebase Console, vá em **Project Settings** (ícone de engrenagem ao lado de "Project Overview")
2. Vá na aba **"Service accounts"**
3. Clique em **"Generate new private key"**
4. Confirme clicando em **"Generate key"**
5. Um arquivo JSON será baixado automaticamente
6. **IMPORTANTE:** Guarde este arquivo com segurança - ele contém credenciais sensíveis!

O arquivo JSON terá esta estrutura:

```json
{
  "type": "service_account",
  "project_id": "seu-projeto-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@seu-projeto-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## Passo 5: Configurar no Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em seu projeto
3. Navegue até **"Settings"** > **"Edge Functions"** > **"Secrets"**
4. Clique em **"Add new secret"**
5. Adicione a seguinte secret:
   - **Nome:** `FCM_SERVICE_ACCOUNT`
   - **Valor:** Cole **TODO O CONTEÚDO** do arquivo JSON baixado (incluindo as chaves `{}`)

## Passo 6: Fazer Deploy da Edge Function

### Opção A: Via Supabase CLI (Recomendado)

```bash
supabase functions deploy send-push-notification
```

### Opção B: Via Dashboard do Supabase

1. Acesse o Supabase Dashboard
2. Vá em **Edge Functions**
3. Clique na função **send-push-notification** (ou crie uma nova)
4. Cole o código do arquivo `supabase/functions/send-push-notification/index.ts`
5. Clique em **Deploy**

## Passo 7: Instalar Dependências

```bash
npm install
npx cap sync
```

## Passo 8: Testar

### No Android

1. Compile o app: `npm run cap:android`
2. Execute no dispositivo ou emulador
3. Faça login no app
4. Vá em Perfil > Configurações
5. Ative as notificações push
6. Peça para alguém enviar uma solicitação de amizade ou curtir seu perfil

### No iOS

1. Compile o app: `npm run cap:ios`
2. Execute em um dispositivo físico (push não funciona em simulador)
3. Faça login no app
4. Vá em Perfil > Configurações
5. Ative as notificações push
6. Peça para alguém enviar uma solicitação de amizade ou curtir seu perfil

## Estrutura Implementada

### Tabelas do Banco de Dados

- `push_tokens` - Armazena tokens de dispositivos
- `notifications` - Armazena histórico de notificações

### Edge Function

- `send-push-notification` - Envia notificações via FCM

### Triggers Automáticos

Os seguintes eventos disparam notificações automaticamente:

1. **user_likes** → Curtida no perfil
2. **friendships (INSERT)** → Solicitação de amizade
3. **friendships (UPDATE)** → Aceitação de amizade
4. **user_messages** → Nova mensagem
5. **events** → Novo evento de organizador seguido

### Componentes React

- `usePushNotifications` - Hook para gerenciar notificações
- `PushNotificationSettings` - Componente de configuração

## Troubleshooting

### Notificações não estão sendo enviadas

1. Verifique se a `FCM_SERVICE_ACCOUNT` está configurada no Supabase
   - Dashboard > Settings > Edge Functions > Secrets
   - Confirme que o valor é um JSON válido
2. Verifique os logs da Edge Function no Supabase Dashboard
   - Dashboard > Edge Functions > send-push-notification > Logs
3. Confirme que o app está registrando o token corretamente
   - Verifique a tabela `push_tokens` no banco de dados

### Erro: "OAuth error" ou "Failed to get access token"

1. Confirme que o JSON da Service Account está completo e válido
2. Verifique se a `private_key` no JSON contém `\n` para quebras de linha
3. Certifique-se de que a Service Account tem permissões corretas no Firebase
4. Teste se o `project_id` no JSON corresponde ao seu projeto Firebase

### Token não está sendo salvo

1. Verifique as permissões de notificação do dispositivo
2. Confira os logs do console para erros
3. Certifique-se de que o Firebase está configurado corretamente
4. No Android: verifique se `google-services.json` está no lugar correto
5. No iOS: verifique se `GoogleService-Info.plist` foi adicionado ao projeto

### Notificações não aparecem no iOS

1. Certifique-se de estar testando em dispositivo físico (não funciona em simulador)
2. Verifique se os certificados APNs estão válidos
3. Confirme que as capabilities estão habilitadas no Xcode:
   - Push Notifications
   - Background Modes > Remote notifications
4. Verifique se o APNs Key foi configurado no Firebase Console

### Erro: "UNAUTHENTICATED" ou "403 Forbidden"

1. A API antiga (Legacy) foi descontinuada
2. Certifique-se de usar a API V1 com OAuth 2.0
3. Verifique se o Service Account tem as permissões corretas:
   - Firebase Console > Project Settings > Service Accounts
   - Deve ter role "Firebase Cloud Messaging Admin"

## Monitoramento

Você pode monitorar as notificações enviadas:

1. No Supabase Dashboard: Logs das Edge Functions
2. No Firebase Console: Cloud Messaging > Reports
3. Na tabela `notifications` do banco de dados

## Considerações de Segurança

- Os tokens são armazenados com segurança no banco de dados
- RLS (Row Level Security) está habilitado
- Usuários só podem gerenciar seus próprios tokens
- A Edge Function valida todos os dados antes de enviar

## Diferenças entre FCM Legacy API e FCM API V1

A implementação atual usa **FCM API V1 com OAuth 2.0**, que é a versão recomendada pelo Google:

### FCM Legacy API (Antiga - Descontinuada)
- ❌ Usa `FCM_SERVER_KEY` (chave de servidor)
- ❌ Endpoint: `https://fcm.googleapis.com/fcm/send`
- ❌ Será descontinuada em junho de 2024
- ❌ Menos segura

### FCM API V1 (Atual - Implementada)
- ✅ Usa `FCM_SERVICE_ACCOUNT` (JSON com OAuth 2.0)
- ✅ Endpoint: `https://fcm.googleapis.com/v1/projects/{project-id}/messages:send`
- ✅ Mais segura e moderna
- ✅ Suporte a longo prazo garantido pelo Google

## Próximos Passos

Para produção, considere:

1. Implementar rate limiting para evitar spam
2. Adicionar suporte para notificações agendadas
3. Criar categorias de notificações (permitir usuário escolher quais receber)
4. Implementar notificações ricas (com imagens, ações, etc.)
5. Adicionar analytics para rastreamento de engagement

## Links Úteis

- [Firebase Console](https://console.firebase.google.com/)
- [Documentação FCM API V1](https://firebase.google.com/docs/cloud-messaging/migrate-v1)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [OAuth 2.0 Service Account](https://developers.google.com/identity/protocols/oauth2/service-account)
