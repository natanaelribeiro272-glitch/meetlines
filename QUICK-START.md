# 🚀 Início Rápido - Meetlines Mobile

## Comandos Principais

```bash
# 1. Instalar dependências
npm install

# 2. Build do projeto web
npm run build

# 3. Adicionar plataformas (primeira vez)
npx cap add android
npx cap add ios

# 4. Sincronizar e abrir Android Studio
npm run cap:android

# 5. Sincronizar e abrir Xcode (somente Mac)
npm run cap:ios
```

## Estrutura de Pastas

```
meetlines/
├── src/                      # Código React
├── dist/                     # Build do app web (gerado)
├── android/                  # Projeto Android (gerado)
├── ios/                      # Projeto iOS (gerado)
├── resources/                # Ícones e splash screens
├── capacitor.config.ts       # Configuração do Capacitor
├── android-permissions.xml   # Permissões Android
├── ios-permissions.txt       # Permissões iOS
└── MOBILE-BUILD-GUIDE.md     # Guia completo
```

## Próximos Passos

1. **Criar ícones**: Coloque `icon.png` (1024x1024) em `resources/`
2. **Criar splash**: Coloque `splash.png` (2732x2732) em `resources/`
3. **Gerar assets**: `npx capacitor-assets generate`
4. **Ler guia completo**: Abra `MOBILE-BUILD-GUIDE.md`

## Problemas?

Leia o guia completo em: `MOBILE-BUILD-GUIDE.md`
