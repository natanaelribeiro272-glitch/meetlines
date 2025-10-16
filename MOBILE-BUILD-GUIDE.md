# 📱 Guia Completo: Publicar Meetlines nas Lojas

Este guia te ajudará a transformar o app web Meetlines em apps nativos para Android e iOS.

---

## 🚀 Passo 1: Preparar o Ambiente

### Requisitos Gerais
```bash
# Instalar Node.js (se ainda não tiver)
# Download: https://nodejs.org/

# Instalar dependências do projeto
npm install

# Instalar Capacitor CLI globalmente
npm install -g @capacitor/cli

# Instalar ferramenta de geração de assets
npm install -g @capacitor/assets
```

### Para Android
- **Android Studio**: [Download aqui](https://developer.android.com/studio)
- **Java JDK 17+**: Instalado automaticamente com Android Studio
- **Conta Google Play Console**: [Criar conta](https://play.google.com/console) ($25 taxa única)

### Para iOS (somente Mac)
- **Xcode 14+**: [Download da App Store](https://apps.apple.com/br/app/xcode/id497799835)
- **Conta Apple Developer**: [Criar conta](https://developer.apple.com/) ($99/ano)
- **macOS 12.5+**: Obrigatório para desenvolvimento iOS

---

## 🎨 Passo 2: Criar Ícones e Splash Screens

### 2.1 Criar o Ícone (1024x1024 px)

Use ferramentas como:
- **Canva**: https://www.canva.com/
- **Figma**: https://www.figma.com/
- **Adobe Express**: https://www.adobe.com/express/

**Requisitos do Ícone:**
- Tamanho: 1024x1024 pixels
- Formato: PNG com fundo transparente (ou cor sólida)
- Design simples e reconhecível
- Fica bem em tamanhos pequenos

Salve como: `resources/icon.png`

### 2.2 Criar a Splash Screen (2732x2732 px)

**Requisitos da Splash Screen:**
- Tamanho: 2732x2732 pixels
- Formato: PNG
- Logo/Branding centralizado na área 1200x1200 do meio
- Cor de fundo sólida que combine com o app

Salve como: `resources/splash.png`

### 2.3 Gerar Assets para todas as resoluções

```bash
# Gerar automaticamente todos os tamanhos necessários
npx capacitor-assets generate
```

---

## 📦 Passo 3: Build do Projeto Web

```bash
# Fazer build de produção
npm run build

# Verificar se a pasta 'dist' foi criada
ls dist
```

---

## 🤖 Passo 4: Gerar e Publicar para Android

### 4.1 Adicionar plataforma Android

```bash
# Adicionar Android ao projeto
npx cap add android

# Sincronizar arquivos
npx cap sync android
```

### 4.2 Configurar Permissões

Abra `android/app/src/main/AndroidManifest.xml` e adicione as permissões do arquivo `android-permissions.xml` dentro da tag `<manifest>`.

### 4.3 Abrir no Android Studio

```bash
npx cap open android
```

### 4.4 Gerar APK/AAB Assinado

**No Android Studio:**

1. **Menu** → **Build** → **Generate Signed Bundle / APK**
2. Escolha **Android App Bundle (AAB)** para Google Play
3. Crie uma nova keystore:
   - Clique em "Create new..."
   - Preencha os dados (salve em local seguro!)
   - **IMPORTANTE**: Guarde o arquivo `.jks` e as senhas!

4. Selecione **release** como build variant
5. Clique em **Finish**

O arquivo AAB estará em: `android/app/release/app-release.aab`

### 4.5 Publicar na Google Play Store

1. Acesse [Google Play Console](https://play.google.com/console)
2. Crie um novo app
3. Preencha as informações:
   - Nome do app
   - Descrição curta (80 caracteres)
   - Descrição completa
   - Screenshots (mínimo 2)
   - Ícone do app (512x512 px)
   - Feature graphic (1024x500 px)
4. Faça upload do AAB
5. Configure classificação de conteúdo
6. Configure política de privacidade
7. Envie para revisão

**Tempo de revisão**: 1-7 dias

---

## 🍎 Passo 5: Gerar e Publicar para iOS

### 5.1 Adicionar plataforma iOS (somente Mac)

```bash
# Adicionar iOS ao projeto
npx cap add ios

# Sincronizar arquivos
npx cap sync ios
```

### 5.2 Configurar Permissões

Abra `ios/App/App/Info.plist` e adicione as permissões do arquivo `ios-permissions.txt` dentro da tag `<dict>`.

### 5.3 Abrir no Xcode

```bash
npx cap open ios
```

### 5.4 Configurar Signing & Capabilities

**No Xcode:**

1. Selecione o projeto "App" no navegador
2. Na aba **Signing & Capabilities**:
   - Marque "Automatically manage signing"
   - Selecione seu Team (Apple Developer Account)
   - Bundle Identifier será: `com.meetlines.app`

### 5.5 Configurar App Store Connect

1. Acesse [App Store Connect](https://appstoreconnect.apple.com/)
2. Crie um novo app
3. Preencha informações básicas:
   - Nome do app
   - Bundle ID: `com.meetlines.app`
   - SKU: `meetlines-001`

### 5.6 Fazer Archive e Upload

**No Xcode:**

1. Selecione dispositivo: **Any iOS Device (arm64)**
2. **Menu** → **Product** → **Archive**
3. Aguarde o build (pode demorar)
4. Na janela Organizer, clique em **Distribute App**
5. Escolha **App Store Connect**
6. Siga os passos e faça upload

### 5.7 Submeter para Revisão

No App Store Connect:

1. Preencha todas as informações obrigatórias:
   - Screenshots (vários tamanhos de tela)
   - Descrição
   - Palavras-chave
   - URL de suporte
   - Política de privacidade
2. Selecione o build que você fez upload
3. Envie para revisão

**Tempo de revisão**: 1-3 dias

---

## 🔄 Atualizações Futuras

Quando fizer mudanças no código:

```bash
# 1. Build do projeto web
npm run build

# 2. Sincronizar com plataformas nativas
npx cap sync

# 3. Para Android
npx cap open android
# Gere novo AAB assinado e faça upload na Play Console

# 4. Para iOS
npx cap open ios
# Faça novo Archive e upload via Xcode
```

**IMPORTANTE**: Sempre incremente o número da versão antes de fazer upload!

- Android: `android/app/build.gradle` → `versionCode` e `versionName`
- iOS: Xcode → Target → General → Version e Build

---

## ⚠️ Problemas Comuns

### Build falha no Android
```bash
# Limpar cache
cd android
./gradlew clean
cd ..
npx cap sync android
```

### Erro de certificados no iOS
- Verifique se sua conta Apple Developer está ativa
- Baixe os certificados e perfis de provisionamento manualmente

### App não conecta com Supabase
- Verifique se o arquivo `.env` está correto
- Confirme que as variáveis estão sendo carregadas no build

### Permissões não funcionam
- Verifique se adicionou todas as permissões nos arquivos de manifesto
- Reinstale o app no dispositivo de teste

---

## 📚 Recursos Úteis

- **Documentação Capacitor**: https://capacitorjs.com/docs
- **Android Developer**: https://developer.android.com/
- **Apple Developer**: https://developer.apple.com/
- **Supabase Mobile**: https://supabase.com/docs/guides/getting-started/tutorials

---

## ✅ Checklist Final

Antes de submeter para as lojas:

- [ ] Testei o app em dispositivos físicos (Android e iOS)
- [ ] Todas as funcionalidades estão funcionando
- [ ] Ícone e splash screen estão corretos
- [ ] Screenshots tirados de dispositivos reais
- [ ] Política de privacidade criada e hospedada
- [ ] Descrição do app revisada (sem erros)
- [ ] Classificação de conteúdo configurada
- [ ] Versão incrementada corretamente
- [ ] Build assinado corretamente
- [ ] Testei o fluxo de pagamento (se aplicável)

---

## 🎉 Sucesso!

Agora você tem seu app Meetlines rodando em Android e iOS!

**Dicas para aprovação:**
- Descreva claramente o que o app faz
- Use screenshots de qualidade profissional
- Teste todas as funcionalidades antes de enviar
- Responda rapidamente se o revisor fizer perguntas
- Tenha uma política de privacidade clara

Boa sorte com suas publicações! 🚀
