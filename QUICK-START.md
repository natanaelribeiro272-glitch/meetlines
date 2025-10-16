# 🚀 Guia Rápido: Rodar Meetlines Mobile

Este guia contém os comandos exatos para rodar o app no Android e iOS.

---

## ✅ Pré-requisitos

### Para Android (Windows, Mac ou Linux)
- Node.js 18+ instalado
- Android Studio instalado
- Variável de ambiente ANDROID_HOME configurada

### Para iOS (Apenas Mac)
- macOS 12.5+
- Xcode 14+ instalado
- CocoaPods instalado: `sudo gem install cocoapods`

---

## 🎯 Passo a Passo Rápido

### 1️⃣ Instalar Dependências (Uma vez)

```bash
# No diretório do projeto
npm install
```

### 2️⃣ Criar Ícone e Splash Screen (Opcional mas Recomendado)

**Opção A: Usar imagens placeholder (para testar rapidamente)**
```bash
# Os placeholders já existem em resources/
# Você pode pular esta etapa e usar os padrões
```

**Opção B: Criar suas próprias imagens**
1. Crie `resources/icon.png` (1024x1024 px)
2. Crie `resources/splash.png` (2732x2732 px)
3. Execute:
```bash
npm install -g @capacitor/assets
npx capacitor-assets generate
```

### 3️⃣ Build do Projeto Web

```bash
npm run build
```

Isso cria a pasta `dist/` com todos os arquivos otimizados.

---

## 🤖 ANDROID

### Primeira Vez: Adicionar Plataforma Android

```bash
# Adicionar Android
npx cap add android

# Sincronizar código
npx cap sync android
```

### Configurar Permissões (Primeira Vez)

Abra o arquivo: `android/app/src/main/AndroidManifest.xml`

Adicione as permissões do arquivo `android-permissions.xml` dentro da tag `<manifest>` (antes de `<application>`).

### Abrir no Android Studio

```bash
npx cap open android
```

### No Android Studio:

1. Aguarde sincronização do Gradle (primeira vez demora ~5-10 min)
2. Conecte seu celular Android via USB ou inicie um emulador
3. No celular: Habilite "Modo Desenvolvedor" e "Depuração USB"
4. Clique no botão ▶️ (Run) verde
5. Selecione seu dispositivo
6. Aguarde instalação e execução

### Atualizar App Após Mudanças no Código

```bash
# 1. Build do código web
npm run build

# 2. Sincronizar com Android
npx cap sync android

# 3. Abrir Android Studio (ele detectará as mudanças)
npx cap open android

# 4. Clique em Run novamente no Android Studio
```

---

## 🍎 iOS (Apenas Mac)

### Primeira Vez: Adicionar Plataforma iOS

```bash
# Adicionar iOS
npx cap add ios

# Instalar dependências nativas
cd ios/App
pod install
cd ../..

# Sincronizar código
npx cap sync ios
```

### Configurar Permissões (Primeira Vez)

Abra o arquivo: `ios/App/App/Info.plist`

Adicione as permissões do arquivo `ios-permissions.txt` dentro da tag `<dict>`.

### Abrir no Xcode

```bash
npx cap open ios
```

### No Xcode:

1. Selecione o projeto "App" no navegador à esquerda
2. Na aba "Signing & Capabilities":
   - Marque "Automatically manage signing"
   - Selecione seu Team (precisa de conta Apple Developer)
3. Selecione um simulador ou conecte seu iPhone
4. Clique no botão ▶️ (Play) no topo
5. Aguarde build e execução

### Atualizar App Após Mudanças no Código

```bash
# 1. Build do código web
npm run build

# 2. Sincronizar com iOS
npx cap sync ios

# 3. Abrir Xcode (ele detectará as mudanças)
npx cap open ios

# 4. Clique em Play novamente no Xcode
```

---

## 🔧 Atalhos Úteis (já configurados no package.json)

```bash
# Build + Sincronizar ambas as plataformas
npm run cap:sync

# Build + Sincronizar + Abrir Android Studio
npm run cap:android

# Build + Sincronizar + Abrir Xcode
npm run cap:ios
```

---

## 🐛 Debug e DevTools

### Android
1. Com o app rodando, abra Chrome
2. Digite na URL: `chrome://inspect`
3. Clique em "inspect" no seu app
4. Use o DevTools normalmente

### iOS
1. Com o app rodando no simulador ou dispositivo
2. Abra Safari → Develop → [Seu Dispositivo] → localhost
3. Use o Web Inspector

---

## 📱 Testar em Dispositivo Real (Recomendado)

### Android
1. Conecte via USB
2. Habilite "Opções do desenvolvedor" no celular:
   - Vá em Configurações → Sobre o telefone
   - Toque 7 vezes em "Número da versão"
   - Volte e entre em "Opções do desenvolvedor"
   - Ative "Depuração USB"
3. Execute no Android Studio

### iOS
1. Conecte iPhone via USB
2. No iPhone: Confie no computador
3. No Xcode: Selecione seu iPhone como destino
4. Execute (primeira vez pedirá para confiar no desenvolvedor no iPhone)

---

## ⚠️ Problemas Comuns

### Erro "ANDROID_HOME not set"
```bash
# Linux/Mac (adicione ao ~/.bashrc ou ~/.zshrc)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Windows
# Adicione nas Variáveis de Ambiente do Sistema
```

### Erro no Gradle (Android)
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### Erro de Pods (iOS)
```bash
cd ios/App
pod repo update
pod install
cd ../..
```

### App não atualiza após mudanças
```bash
# Limpar completamente e recompilar
npm run build
npx cap sync
# Feche e abra o Android Studio/Xcode novamente
# Delete o app do dispositivo e rode novamente
```

---

## 🎉 Pronto!

Agora você tem o Meetlines rodando como app nativo no seu dispositivo!

**Próximos passos:**
- Teste todas as funcionalidades (câmera, scanner, notificações)
- Personalize ícone e splash screen
- Quando estiver pronto, siga o `MOBILE-BUILD-GUIDE.md` para publicar nas lojas

---

## 📚 Links Úteis

- [Documentação Capacitor](https://capacitorjs.com/docs)
- [Guia Android Studio](https://developer.android.com/studio/run/device)
- [Guia Xcode](https://developer.apple.com/documentation/xcode/running-your-app-in-simulator-or-on-a-device)
