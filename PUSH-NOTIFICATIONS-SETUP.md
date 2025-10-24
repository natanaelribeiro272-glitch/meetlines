# Configuração de Notificações Push

Este guia explica como configurar as notificações push no aplicativo usando Firebase Cloud Messaging (FCM).

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

## Passo 4: Obter Server Key do Firebase

1. No Firebase Console, vá em Project Settings
2. Vá na aba "Cloud Messaging"
3. Copie o "Server key" (também chamado de Legacy server key)

## Passo 5: Configurar no Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em seu projeto
3. Navegue até "Settings" > "Edge Functions" > "Secrets"
4. Adicione uma nova secret:
   - Nome: `FCM_SERVER_KEY`
   - Valor: Cole o Server Key copiado do Firebase

## Passo 6: Instalar Dependências

```bash
npm install
npx cap sync
```

## Passo 7: Testar

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

1. Verifique se a `FCM_SERVER_KEY` está configurada no Supabase
2. Verifique os logs da Edge Function no Supabase Dashboard
3. Confirme que o app está registrando o token corretamente

### Token não está sendo salvo

1. Verifique as permissões de notificação do dispositivo
2. Confira os logs do console para erros
3. Certifique-se de que o Firebase está configurado corretamente

### Notificações não aparecem no iOS

1. Certifique-se de estar testando em dispositivo físico
2. Verifique se os certificados APNs estão válidos
3. Confirme que as capabilities estão habilitadas no Xcode

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

## Próximos Passos

Para produção, considere:

1. Implementar rate limiting para evitar spam
2. Adicionar suporte para notificações agendadas
3. Criar categorias de notificações (permitir usuário escolher quais receber)
4. Implementar notificações ricas (com imagens, ações, etc.)
5. Adicionar analytics para rastreamento de engagement
