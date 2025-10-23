# Guia Completo: Rodar Aplicativo no Android Studio

## ✅ Status Atual do Projeto

- ✅ Dependências Node.js instaladas
- ✅ Build de produção executado com sucesso
- ✅ Plataforma Android adicionada ao Capacitor
- ✅ Assets (ícones) gerados para Android
- ✅ Código sincronizado com projeto Android
- ✅ Permissões configuradas no AndroidManifest.xml
- ✅ Gradle configurado (minSDK: 23, targetSDK: 35)

---

## 📋 Passo a Passo - Comandos para Executar

### 1️⃣ Verificar Dependências

```bash
# Verificar Node.js e npm
node --version  # Deve ser v18+ (atual: v22.21.0)
npm --version   # Deve ser v9+ (atual: v10.9.4)

# Instalar dependências (se necessário)
npm install
```

### 2️⃣ Build de Produção

```bash
# Executar build do projeto
npm run build

# Verificar se dist/ foi criado
ls -la dist/
```

**Resultado esperado:**
```
✓ 2801 modules transformed
✓ built in 10s
```

### 3️⃣ Adicionar Plataforma Android (JÁ FEITO)

```bash
# Este comando JÁ FOI EXECUTADO, mas caso precise refazer:
npx cap add android
```

### 4️⃣ Gerar Assets para Android (JÁ FEITO)

```bash
# Os ícones já foram gerados, mas caso precise refazer:
npx @capacitor/assets generate --iconBackgroundColor '#F5F5F0' --iconBackgroundColorDark '#000000' --splashBackgroundColor '#F5F5F0' --splashBackgroundColorDark '#000000'
```

### 5️⃣ Sincronizar Projeto Android

```bash
# Sincronizar código e assets com Android
npx cap sync android

# OU usar o comando completo que faz build + sync
npm run cap:sync
```

**Resultado esperado:**
```
✔ Copying web assets
✔ Updating Android plugins
[info] Sync finished in 0.3s
```

### 6️⃣ Abrir no Android Studio

```bash
# Abrir projeto Android no Android Studio
npx cap open android

# OU manualmente abrir o diretório android/ no Android Studio
```

---

## 🖥️ No Android Studio

### Primeira Vez Abrindo o Projeto

1. **Android Studio vai aparecer:**
   - "Trust Gradle project?" → Clique em **"Trust Project"**

2. **Sync do Gradle (automático):**
   - No canto inferior direito, você verá: "Gradle sync in progress..."
   - Aguarde até aparecer: "BUILD SUCCESSFUL" ou "Gradle sync finished"
   - **Tempo estimado:** 2-5 minutos na primeira vez

3. **Possíveis downloads automáticos:**
   - Android SDK Platform 35
   - Build Tools 35.0.0
   - Google Play Services
   - Gradle wrapper
   - Deixe o Android Studio baixar tudo automaticamente

### Configurar Emulador ou Dispositivo

#### Opção A: Usar Emulador (Android Virtual Device)

1. No Android Studio, clique em **"Device Manager"** (ícone de celular no canto superior direito)
2. Clique em **"Create Device"**
3. Escolha um dispositivo (recomendado: **Pixel 6**)
4. Clique em **"Next"**
5. Selecione uma imagem do sistema:
   - **Recomendado:** API Level 34 (Android 14) ou API Level 35 (Android 15)
   - Clique em **"Download"** ao lado da versão desejada
   - Aguarde o download (pode demorar 5-10 minutos)
6. Clique em **"Next"** e depois **"Finish"**
7. O emulador aparecerá na lista de dispositivos

#### Opção B: Usar Dispositivo Físico

1. No seu celular Android:
   - Vá em **Configurações** → **Sobre o telefone**
   - Toque 7 vezes em **"Número da versão"** para ativar modo desenvolvedor
   - Volte e vá em **Configurações** → **Sistema** → **Opções do desenvolvedor**
   - Ative **"Depuração USB"**
   - Conecte o celular no computador via USB
   - Na mensagem do celular, clique em **"Permitir depuração USB"**

2. No Android Studio:
   - O dispositivo deve aparecer automaticamente na lista de dispositivos

### Executar o Aplicativo

1. **Selecione o dispositivo** no dropdown superior (emulador ou físico)

2. **Clique no botão ▶️ (Run)** ou pressione `Shift + F10`

3. **Aguarde o build e instalação:**
   - "Building..." (30 segundos - 2 minutos na primeira vez)
   - "Installing APK..."
   - "Launching activity..."

4. **Aplicativo abrirá automaticamente** no dispositivo/emulador

---

## 🔧 Configurações Importantes Já Aplicadas

### AndroidManifest.xml
✅ Permissões configuradas:
- Internet e rede
- Câmera (para scanner de QR Code)
- Galeria/Mídia (para upload de fotos)
- Notificações

### Gradle (variables.gradle)
✅ Versões configuradas:
- **minSdkVersion:** 23 (Android 6.0+)
- **targetSdkVersion:** 35 (Android 15)
- **compileSdkVersion:** 35

### Capacitor Config
✅ Configurações:
- **appId:** com.meetlines.app
- **appName:** Meetlines
- **webDir:** dist
- Plugins configurados: BarcodeScanner, Camera

---

## 🐛 Solução de Problemas Comuns

### Erro: "SDK not found"
**Solução:**
1. Abra **File** → **Settings** (ou **Preferences** no Mac)
2. Vá em **Appearance & Behavior** → **System Settings** → **Android SDK**
3. Verifique se o SDK está instalado em um caminho válido
4. Clique em **Apply** e reinicie o Android Studio

### Erro: "Gradle sync failed"
**Solução:**
```bash
# Limpar cache do Gradle
cd android
./gradlew clean

# Voltar e sincronizar
cd ..
npx cap sync android
```

### Erro: "Unable to locate adb"
**Solução:**
1. Certifique-se de que o Android SDK está instalado
2. Adicione ao PATH (no terminal):
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Aplicativo não abre no emulador
**Solução:**
1. Feche o emulador
2. No Android Studio: **Tools** → **Device Manager**
3. Clique em **"Cold Boot Now"** no emulador
4. Aguarde o emulador reiniciar completamente
5. Execute o app novamente

### Erro: "Manifest merger failed"
**Solução:**
1. Verifique se não há conflitos no AndroidManifest.xml
2. Execute: `npx cap sync android` novamente

### Build muito lento
**Solução:**
1. Habilite Gradle Daemon:
   - Edite ou crie: `~/.gradle/gradle.properties`
   - Adicione:
     ```
     org.gradle.daemon=true
     org.gradle.parallel=true
     org.gradle.caching=true
     ```

---

## 📱 Recursos do Aplicativo

### Funcionalidades que usam permissões nativas:

1. **Câmera:**
   - Scanner de QR Code (validação de ingressos)
   - Upload de foto de perfil
   - Upload de fotos de eventos

2. **Galeria:**
   - Selecionar fotos da galeria
   - Upload de imagens

3. **Internet:**
   - Conexão com Supabase (backend)
   - Upload/download de imagens
   - Sincronização de dados

4. **Notificações:**
   - Alertas de novos eventos
   - Lembretes de eventos
   - Mensagens do sistema

---

## 🔄 Workflow de Desenvolvimento

### Fazer alterações no código

```bash
# 1. Fazer mudanças nos arquivos em src/
# Exemplo: editar src/pages/Home.tsx

# 2. Build do projeto
npm run build

# 3. Sincronizar com Android
npx cap sync android

# 4. No Android Studio, clique em Run novamente
# OU use o atalho:
npm run cap:android
```

### Atalho completo (build + sync + open)

```bash
# Este comando faz tudo de uma vez:
npm run cap:android
```

---

## 📊 Checklist Final Antes de Rodar

- [ ] Node.js v18+ instalado
- [ ] npm instalado
- [ ] Android Studio instalado
- [ ] Android SDK instalado (API 34 ou 35)
- [ ] Emulador criado OU dispositivo físico conectado
- [ ] `npm install` executado
- [ ] `npm run build` executado sem erros
- [ ] `npx cap sync android` executado
- [ ] AndroidManifest.xml com permissões corretas
- [ ] Projeto aberto no Android Studio
- [ ] Gradle sync finalizado com sucesso

---

## 🎯 Comando Rápido para Abrir no Android Studio

Se tudo estiver configurado, basta executar:

```bash
# Abre diretamente no Android Studio
npx cap open android
```

**Ou via linha de comando:**
```bash
# No Linux/Mac
studio android/

# No Windows
"C:\Program Files\Android\Android Studio\bin\studio64.exe" android\
```

---

## ✅ Projeto 100% Pronto

O projeto está configurado e pronto para rodar. Todos os arquivos necessários foram gerados e as configurações foram aplicadas.

**Próximo passo:** Abra o Android Studio e execute o aplicativo! 🚀
