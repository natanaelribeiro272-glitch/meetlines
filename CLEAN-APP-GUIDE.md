# Guia: Limpar e Testar App do Zero no Android

Este guia explica como limpar completamente o aplicativo Android e testá-lo como se fosse uma instalação nova, sem dados, cache ou permissões anteriores.

## 📱 Método 1: Desinstalar Manualmente (Mais Simples)

### No Dispositivo Físico ou Emulador Android:

1. **Abra as Configurações** do dispositivo
2. Vá em **"Aplicativos"** ou **"Apps"**
3. Encontre **"Meetlines"** na lista
4. Toque no app e clique em **"Desinstalar"**
5. Confirme a desinstalação

✅ **Isso remove:**
- Todos os dados do app
- Cache e arquivos temporários
- Todas as permissões concedidas
- Tokens salvos (incluindo FCM)
- Login armazenado

---

## 🛠️ Método 2: Usando Comandos NPM (Recomendado)

### Scripts Criados:

```bash
# Limpar cache e build do Android
npm run clean:android

# Desinstalar app de todos os dispositivos conectados
npm run uninstall:android

# Limpar, recompilar e abrir Android Studio (tudo em um)
npm run fresh:android
```

### Passo a Passo Completo:

```bash
# 1. Limpar build anterior
npm run clean:android

# 2. Desinstalar app dos dispositivos
npm run uninstall:android

# 3. Fazer nova build e sincronizar
npm run build

# 4. Sincronizar com Capacitor
npx cap sync android

# 5. Abrir no Android Studio
npx cap open android
```

**OU simplesmente:**

```bash
npm run fresh:android
```

---

## 🔧 Método 3: Limpeza Profunda (Problemas Persistentes)

### Se ainda tiver problemas com cache:

```bash
# 1. Fechar Android Studio completamente

# 2. Limpar Gradle Cache
cd android
./gradlew clean
./gradlew cleanBuildCache

# 3. Deletar pastas de build (Windows)
rmdir /s /q .gradle
rmdir /s /q build
rmdir /s /q app\build

# 3. Deletar pastas de build (Linux/Mac)
rm -rf .gradle
rm -rf build
rm -rf app/build

# 4. Voltar para raiz do projeto
cd ..

# 5. Recompilar tudo
npm run build
npx cap sync android

# 6. Abrir Android Studio
npx cap open android
```

---

## ✅ Checklist Pós-Instalação

Após reinstalar o app do zero, verifique:

### 1. Permissões Solicitadas:
- [ ] Permissão de **Localização** (para geolocalização de eventos)
- [ ] Permissão de **Câmera** (para escanear QR codes)
- [ ] Permissão de **Galeria/Fotos** (para upload de imagens)
- [ ] Permissão de **Notificações Push** (nas configurações do app)

### 2. Fluxo de Login:
- [ ] App solicita login (não está logado automaticamente)
- [ ] Pode criar nova conta ou fazer login
- [ ] Dados não estão pré-preenchidos

### 3. Notificações Push:
- [ ] Ir em **Perfil** → **Configurações**
- [ ] Ver opção de **Notificações Push**
- [ ] Clicar em **"Ativar Notificações"**
- [ ] Sistema Android solicita permissão de notificações
- [ ] Após conceder, ver status **"Notificações ativadas"**

### 4. Verificar Token FCM no Console:
```javascript
// Abrir DevTools no Android Studio (Logcat)
// Filtrar por "Push" para ver logs
// Deve aparecer: "Push registration success, token: ..."
```

### 5. Validar no Supabase:
- [ ] Acessar Supabase Dashboard
- [ ] Ir em **Table Editor** → **push_tokens**
- [ ] Verificar se há um novo registro com:
  - `user_id` do usuário logado
  - `token` FCM gerado
  - `platform` = "android"
  - `updated_at` com data/hora recente

---

## 🐛 Troubleshooting

### App ainda está logado ou com dados antigos:

**Causa:** O app não foi desinstalado corretamente ou há múltiplas versões instaladas.

**Solução:**
```bash
# Desinstalar TODAS as versões
adb uninstall com.meetlines.mobileapp

# Verificar se foi removido
adb shell pm list packages | grep meetlines

# Se ainda aparecer, forçar remoção
adb shell pm uninstall -k --user 0 com.meetlines.mobileapp
```

### Permissões não são solicitadas:

**Causa:** Permissões já foram concedidas anteriormente e ficaram no sistema.

**Solução:**
```bash
# Resetar permissões do app
adb shell pm reset-permissions

# OU resetar permissões específicas
adb shell pm revoke com.meetlines.mobileapp android.permission.ACCESS_FINE_LOCATION
adb shell pm revoke com.meetlines.mobileapp android.permission.CAMERA
adb shell pm revoke com.meetlines.mobileapp android.permission.POST_NOTIFICATIONS
```

### Gradle build falha:

**Causa:** Cache corrompido ou conflito de versões.

**Solução:**
```bash
cd android

# Parar todos os daemons do Gradle
./gradlew --stop

# Limpar cache
./gradlew clean cleanBuildCache

# Deletar cache global do Gradle (ATENÇÃO: afeta todos os projetos)
rm -rf ~/.gradle/caches/
rm -rf ~/.gradle/wrapper/

# Rebuild
./gradlew build
```

### Token FCM não está sendo gerado:

**Verificar:**
1. Arquivo `google-services.json` está em `android/app/`
2. Package name no Firebase Console é `com.meetlines.mobileapp`
3. Plugin do Google Services está sendo aplicado (ver logs do build)
4. Permissão de notificações foi concedida no Android

**Ver logs:**
```bash
# Abrir Logcat no Android Studio
# Filtrar por tag: "PushNotifications" ou "FCM"
# Procurar por erros ou mensagens de token
```

---

## 📋 Comandos Úteis ADB

```bash
# Listar dispositivos conectados
adb devices

# Ver logs em tempo real (Push Notifications)
adb logcat | grep -i push

# Ver logs do app específico
adb logcat | grep meetlines

# Limpar todos os dados do app (sem desinstalar)
adb shell pm clear com.meetlines.mobileapp

# Ver permissões do app
adb shell dumpsys package com.meetlines.mobileapp | grep permission

# Testar notificação via linha de comando
adb shell am broadcast -a com.meetlines.mobileapp.NOTIFICATION_TEST
```

---

## 🚀 Fluxo Recomendado para Testes

### 1. Preparação (uma vez):
```bash
npm install
```

### 2. Antes de cada teste do zero:
```bash
# Desinstalar app (manualmente no dispositivo ou via ADB)
adb uninstall com.meetlines.mobileapp

# Limpar e recompilar
npm run fresh:android
```

### 3. No Android Studio:
- Conectar dispositivo ou iniciar emulador
- Clicar em **Run** (▶️)
- Aguardar instalação

### 4. No App:
- Observar solicitações de permissões
- Fazer login
- Navegar até configurações
- Ativar notificações push
- Verificar se token foi salvo (via Logcat ou Supabase)

### 5. Testar Notificações:
- Pedir para outro usuário curtir seu perfil
- Ou enviar solicitação de amizade
- Ou enviar mensagem
- Verificar se notificação chegou

---

## 🔒 Verificar Configuração Firebase

### Confirmar que está tudo certo:

1. **google-services.json existe:**
```bash
ls -la android/app/google-services.json
```

2. **Package name correto:**
```bash
# Ver no arquivo
cat android/app/google-services.json | grep package_name

# Deve retornar: "package_name": "com.meetlines.mobileapp"
```

3. **Plugin aplicado no build:**
```bash
# Ver logs do build Gradle
# Procurar por: "Applying Google Services plugin"
```

---

## ✨ Dicas Adicionais

### Testar em Emulador vs Dispositivo Real:

**Emulador:**
- ✅ Ótimo para testes rápidos
- ✅ Fácil de resetar (pode criar novo emulador)
- ⚠️ Push Notifications funcionam, mas podem ter delay
- ⚠️ Geolocalização precisa ser simulada

**Dispositivo Real:**
- ✅ Melhor para testes de push notifications
- ✅ Geolocalização real
- ✅ Performance real
- ⚠️ Mais trabalhoso para limpar dados

### Criar Emulador Limpo no Android Studio:

1. Abrir **Device Manager** no Android Studio
2. Clicar em **"Create Device"**
3. Escolher hardware (ex: Pixel 6)
4. Selecionar System Image (Android 13 ou superior)
5. Nomear (ex: "Meetlines Test - Clean")
6. Finish

Sempre que precisar testar do zero, pode deletar e recriar o emulador!

---

## 📞 Suporte

Se após seguir este guia ainda tiver problemas:

1. Verificar logs do Logcat no Android Studio
2. Verificar tabela `push_tokens` no Supabase
3. Verificar logs da Edge Function `send-push-notification`
4. Confirmar que `FCM_SERVICE_ACCOUNT` está configurada no Supabase

---

**Última atualização:** $(date +%Y-%m-%d)
