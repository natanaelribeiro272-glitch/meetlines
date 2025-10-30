# 🔐 Como Criar e Configurar Keystore para Android

## ⚠️ IMPORTANTE

O erro que você está recebendo:
```
Missing options. Please supply all options for android signing.
```

Acontece porque você precisa criar um **keystore** (arquivo de assinatura) antes de gerar um APK/AAB assinado.

---

## 🎯 Escolha Seu Método

### Para TESTAR (Desenvolvimento) - NÃO precisa de keystore:

```powershell
# Use este método se só quer testar o app:
npm run build
npx cap sync android
npx cap open android
# Depois clique em Run ▶️ no Android Studio
```

### Para PUBLICAR (Produção) - Precisa de keystore:

Continue lendo este guia 👇

---

## 📝 Método 1: Criar Keystore via Android Studio (MAIS FÁCIL)

### Passo 1: Abrir o Projeto

```powershell
npx cap open android
```

### Passo 2: Aguardar Gradle Sync

Aguarde o Android Studio terminar de sincronizar (canto inferior: "Gradle sync finished")

### Passo 3: Gerar Keystore

1. No Android Studio, vá em: **Build** → **Generate Signed Bundle / APK**

2. Selecione: **Android App Bundle** (recomendado para Play Store)
   - Ou escolha **APK** se quiser instalar diretamente

3. Clique em **Next**

4. Clique em **Create new...** (para criar novo keystore)

5. Preencha o formulário:

```
Key store path: C:\Users\Natan\meetlines-keystore.jks
Password: [crie uma senha forte, ex: MeetL!nes2024#Secure]
Confirm: [mesma senha]

--- Clique em OK ---

Alias: meetlines
Password: [crie outra senha forte]
Confirm: [mesma senha]
Validity (years): 25

Certificate:
First and Last Name: Seu Nome Completo
Organizational Unit: Meetlines Development
Organization: Meetlines
City or Locality: Sua Cidade
State or Province: Seu Estado
Country Code (XX): BR
```

6. Clique em **OK**

7. Certifique-se que "Remember passwords" está marcado (para esta sessão)

8. Selecione **release** como build variant

9. Clique em **Finish**

### Passo 4: Aguardar Build

- O Android Studio vai compilar o app (2-5 minutos)
- Quando finalizar, mostrará onde o arquivo foi salvo

**Arquivo gerado:**
- AAB: `android/app/release/app-release.aab` (para Play Store)
- APK: `android/app/release/app-release.apk` (para instalar diretamente)

### ⚠️ CRÍTICO: Salvar Informações

**COPIE E SALVE EM LOCAL SEGURO:**

```
=================================
MEETLINES KEYSTORE INFO
=================================
Arquivo: C:\Users\Natan\meetlines-keystore.jks
Senha do Keystore: [sua senha]
Alias: meetlines
Senha do Alias: [sua senha]
Data de criação: [data de hoje]
=================================
```

**💡 Dicas:**
- Salve em gerenciador de senhas (1Password, LastPass, Bitwarden)
- Faça backup do arquivo `.jks` em nuvem (Google Drive, Dropbox)
- **Se perder, não poderá atualizar o app na Play Store!**

---

## 📝 Método 2: Criar Keystore via Linha de Comando

### Usando keytool (Java)

```powershell
# Navegue até uma pasta segura
cd C:\Users\Natan

# Crie o keystore
keytool -genkey -v -keystore meetlines-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias meetlines
```

**Responda as perguntas:**
```
Enter keystore password: [digite senha forte]
Re-enter new password: [confirme]
What is your first and last name? [Seu Nome]
What is the name of your organizational unit? [Meetlines]
What is the name of your organization? [Meetlines]
What is the name of your City or Locality? [Sua Cidade]
What is the name of your State or Province? [Seu Estado]
What is the two-letter country code for this unit? [BR]
Is CN=..., OU=..., O=..., L=..., ST=..., C=... correct? [yes]

Enter key password for <meetlines>: [digite senha do alias]
Re-enter new password: [confirme]
```

Keystore criado em: `C:\Users\Natan\meetlines-keystore.jks`

---

## 🔧 Método 3: Configurar para Usar Linha de Comando

### Criar arquivo key.properties

1. Copie o arquivo de exemplo:

```powershell
cd android
copy key.properties.example key.properties
```

2. Edite `android/key.properties` com suas informações reais:

```properties
storeFile=C:/Users/Natan/meetlines-keystore.jks
storePassword=SUA_SENHA_KEYSTORE
keyAlias=meetlines
keyPassword=SUA_SENHA_ALIAS
```

3. **IMPORTANTE**: Adicione ao `.gitignore`:

```powershell
# Na raiz do projeto, edite .gitignore e adicione:
android/key.properties
```

### Agora pode usar o comando:

```powershell
npx cap build android
```

---

## 🚀 Comandos Rápidos Após Configurar

### Gerar AAB (Para Play Store):

```powershell
# Via Capacitor
npx cap build android --androidreleasetype AAB

# OU via Android Studio
# Build > Generate Signed Bundle / APK > Android App Bundle
```

### Gerar APK (Para instalar diretamente):

```powershell
# Via Capacitor
npx cap build android --androidreleasetype APK

# OU via Android Studio
# Build > Generate Signed Bundle / APK > APK
```

---

## 📱 Onde Encontrar os Arquivos Gerados

### Via Android Studio:
```
android/app/release/app-release.aab  (Bundle)
android/app/release/app-release.apk  (APK)
```

### Via linha de comando:
```
android/app/build/outputs/bundle/release/app-release.aab
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🐛 Solução de Problemas

### Erro: "Keystore file does not exist"

**Solução:**
- Verifique o caminho no `key.properties`
- Use barras normais `/` no caminho (não `\`)
- Exemplo: `C:/Users/Natan/meetlines-keystore.jks`

### Erro: "Incorrect keystore password"

**Solução:**
- Verifique se a senha está correta no `key.properties`
- Tente gerar novo keystore se esqueceu a senha

### Erro: "Cannot find alias"

**Solução:**
- Verifique se o alias está correto no `key.properties`
- Deve ser exatamente o mesmo usado ao criar o keystore

### Build falha no Gradle

**Solução:**
```powershell
cd android
./gradlew clean
cd ..
npx cap sync android
```

---

## ✅ Checklist Final

Antes de publicar na Play Store:

- [ ] Keystore criado e salvo em local seguro
- [ ] Senhas anotadas e guardadas
- [ ] Backup do arquivo `.jks` feito
- [ ] `key.properties` configurado (se usar linha de comando)
- [ ] `key.properties` adicionado ao `.gitignore`
- [ ] AAB gerado com sucesso
- [ ] Testado instalação e funcionamento
- [ ] Versão incrementada em `build.gradle`:
  ```gradle
  versionCode 1  // Incrementar a cada release
  versionName "1.0"  // Versão visível pro usuário
  ```

---

## 🎯 Resumo Rápido

**Para TESTAR (sem keystore):**
```powershell
npx cap open android
# Clique Run ▶️ no Android Studio
```

**Para PUBLICAR (primeira vez):**
```powershell
npx cap open android
# Build > Generate Signed Bundle / APK
# Crie keystore e siga wizard
```

**Para PUBLICAR (após configurar):**
```powershell
npx cap build android
# OU use Android Studio novamente
```

---

## 📞 Ajuda Adicional

Se continuar com problemas, verifique:
- Android Studio está atualizado
- Java JDK está instalado
- Variáveis de ambiente configuradas
- Gradle sync concluído sem erros

**Documentação oficial:**
- Capacitor: https://capacitorjs.com/docs/android
- Android Signing: https://developer.android.com/studio/publish/app-signing

---

## 🔒 Segurança

**NUNCA:**
- ❌ Commite keystore no Git
- ❌ Commite key.properties no Git
- ❌ Compartilhe senhas publicamente
- ❌ Use senhas fracas

**SEMPRE:**
- ✅ Guarde backup do keystore
- ✅ Use senhas fortes e únicas
- ✅ Salve em gerenciador de senhas
- ✅ Faça backup em múltiplos locais seguros

Se perder o keystore, terá que criar novo app na Play Store! 🚨
