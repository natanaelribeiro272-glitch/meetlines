# 🍎 Guia de Build iOS - Meetlines

## ✅ Status do Projeto iOS

O projeto está **100% PRONTO** para abrir no Xcode! Todos os arquivos e configurações necessários foram criados.

---

## 📋 Pré-requisitos

### **Obrigatório:**
- **macOS** (Big Sur 11.0 ou superior)
- **Xcode 14+** instalado da App Store
- **CocoaPods** instalado: `sudo gem install cocoapods`
- **Conta Apple Developer** (gratuita ou paga)

---

## 🚀 Como Abrir no Xcode

### **Opção 1: Comando Automático (Recomendado)**
```bash
npm run fresh:ios
```

Esse comando:
1. ✅ Faz build do projeto web
2. ✅ Sincroniza com iOS
3. ✅ Abre automaticamente no Xcode

---

### **Opção 2: Passo a Passo Manual**

```bash
# 1. Build do projeto
npm run build

# 2. Sincronizar com iOS
npx cap sync ios

# 3. Instalar pods (dependências iOS)
cd ios/App
pod install
cd ../..

# 4. Abrir no Xcode
npx cap open ios
```

---

## 🔐 Permissões Configuradas

As seguintes permissões já estão configuradas no `Info.plist`:

✅ **NSCameraUsageDescription** - Câmera para QR codes e fotos
✅ **NSPhotoLibraryUsageDescription** - Acesso à galeria de fotos
✅ **NSPhotoLibraryAddUsageDescription** - Salvar fotos na galeria
✅ **NSMicrophoneUsageDescription** - Acesso ao microfone
✅ **NSLocationWhenInUseUsageDescription** - Localização para eventos próximos
✅ **NSLocationAlwaysAndWhenInUseUsageDescription** - Localização em background

---

## 🔧 Plugins Capacitor Instalados

O projeto inclui os seguintes plugins nativos:

- `@capacitor/camera` - Câmera e galeria de fotos
- `@capacitor/geolocation` - Localização GPS
- `@capacitor/push-notifications` - Notificações push
- `@capacitor-mlkit/barcode-scanning` - Leitor de QR Code

---

## 📱 Configuração no Xcode

### **1. Configurar Team & Bundle ID**

Ao abrir no Xcode:

1. Selecione o projeto **App** na barra lateral
2. Na aba **Signing & Capabilities**:
   - Marque ✅ **Automatically manage signing**
   - Selecione seu **Team** (conta Apple Developer)
   - O Bundle ID já está configurado: `com.meetlines.mobileapp`

### **2. Selecionar Dispositivo**

Na barra superior do Xcode:
- Selecione um **simulador iOS** (ex: iPhone 15 Pro)
- Ou conecte um **iPhone físico** via USB

### **3. Build & Run**

Clique no botão ▶️ **Run** ou pressione `⌘ + R`

---

## 🐛 Problemas Comuns

### **Erro: "Unable to find a destination..."**

**Solução:** Instale simuladores iOS:
```
Xcode → Settings → Platforms → iOS → Download
```

---

### **Erro: "Failed to prepare device for development"**

**Solução:** No iPhone físico:
1. Settings → General → VPN & Device Management
2. Confiar no certificado de desenvolvedor

---

### **Erro de CocoaPods**

**Solução:** Reinstalar pods:
```bash
cd ios/App
pod deintegrate
pod install
cd ../..
```

---

### **Erro: "Command PhaseScriptExecution failed"**

**Solução:** Limpar build:
```
Xcode → Product → Clean Build Folder (⇧⌘K)
```

Depois rebuild.

---

## 📦 Scripts Disponíveis

```bash
# Build + Sync + Abrir no Xcode
npm run cap:ios

# Fresh build (recomendado)
npm run fresh:ios

# Apenas sincronizar (após mudanças)
npx cap sync ios

# Apenas abrir Xcode
npx cap open ios
```

---

## 🎯 Próximos Passos

### **Para Teste em Simulador:**
1. Execute `npm run fresh:ios`
2. Selecione simulador no Xcode
3. Clique em Run ▶️

### **Para Teste em Dispositivo Físico:**
1. Conecte iPhone via USB
2. No iPhone: Settings → General → VPN & Device Management → Confiar
3. No Xcode: Selecione seu iPhone na barra superior
4. Clique em Run ▶️

### **Para Publicar na App Store:**
1. Configure ícones e splash screens em `ios/App/App/Assets.xcassets`
2. Configure versão em Xcode: General → Version
3. Archive: Product → Archive
4. Upload via Xcode Organizer

---

## 📁 Estrutura do Projeto iOS

```
ios/
├── App/
│   ├── App/
│   │   ├── AppDelegate.swift       # Arquivo principal
│   │   ├── Info.plist              # Permissões e configurações
│   │   ├── capacitor.config.json   # Config do Capacitor
│   │   ├── public/                 # Assets web (gerado automaticamente)
│   │   └── Assets.xcassets/        # Ícones e splash screens
│   ├── App.xcodeproj/              # Projeto Xcode
│   ├── App.xcworkspace/            # Workspace Xcode (use este!)
│   └── Podfile                     # Dependências CocoaPods
```

---

## ✅ Checklist Final

Antes de compilar, verifique:

- [ ] Xcode instalado e atualizado
- [ ] CocoaPods instalado (`sudo gem install cocoapods`)
- [ ] Projeto buildado (`npm run build`)
- [ ] Pods instalados (`cd ios/App && pod install`)
- [ ] Bundle ID configurado no Xcode
- [ ] Team selecionado (conta Apple Developer)
- [ ] Dispositivo/simulador selecionado

---

## 🆘 Suporte

Se encontrar problemas:

1. **Limpe e reconstrua:**
   ```bash
   npm run fresh:ios
   ```

2. **Reinstale pods:**
   ```bash
   cd ios/App
   rm -rf Pods Podfile.lock
   pod install
   cd ../..
   ```

3. **No Xcode:**
   - Product → Clean Build Folder (⇧⌘K)
   - Fechar Xcode
   - Reabrir com `npx cap open ios`

---

## 🎉 Tudo Pronto!

Seu app Meetlines está pronto para ser compilado e testado no iOS!

Execute agora:
```bash
npm run fresh:ios
```

E comece a desenvolver! 🚀
