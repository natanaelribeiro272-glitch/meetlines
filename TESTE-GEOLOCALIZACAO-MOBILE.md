# Teste de Geolocalização Mobile

## ✅ Correções Implementadas

### 1. Hook useGeolocation Corrigido
- **Antes**: Usava `(Capacitor as any).Plugins?.Geolocation` (método deprecated)
- **Agora**: Importa diretamente `import { Geolocation } from '@capacitor/geolocation'`
- Compatível com Capacitor 7.x

### 2. Permissões Android Configuradas
Já estão no `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

### 3. Fluxo de Detecção Automática
O sistema detecta automaticamente se está rodando em:
- **Web**: Usa `navigator.geolocation`
- **Mobile Native**: Usa `@capacitor/geolocation`

## 📱 Como Testar no Mobile

### Passo 1: Sincronizar com Capacitor
```bash
npm run cap:sync
```

### Passo 2: Abrir no Android Studio
```bash
npm run cap:android
```

### Passo 3: Testar o Onboarding
1. Abra o app no dispositivo ou emulador
2. Faça logout (se estiver logado)
3. Clique em "Criar conta" ou acesse o onboarding
4. Na tela de "Localização" (Step 1):
   - O sistema deve solicitar permissão de localização automaticamente
   - OU você pode clicar em "Usar minha localização atual"

### O que deve acontecer:

#### ✅ Cenário de Sucesso
1. App solicita permissão de localização
2. Usuário concede permissão
3. Sistema obtém coordenadas GPS (lat, lon)
4. Faz geocodificação reversa via OpenStreetMap
5. Busca cidade correspondente no banco (5.570 cidades BR)
6. Preenche automaticamente a cidade
7. Botão "Próximo" fica habilitado
8. Toast de sucesso: "Localização detectada: [Nome da Cidade]"

#### ⚠️ Possíveis Problemas e Soluções

**Problema 1: Permissão Negada**
- Mensagem: "Permissão de localização negada"
- Solução: Abrir configurações do app e permitir localização

**Problema 2: Timeout**
- Mensagem: "Tempo esgotado. Certifique-se de estar em local aberto"
- Solução: Ir para área externa ou janela, aguardar GPS conectar

**Problema 3: GPS Desativado**
- Mensagem: "Localização indisponível. Ative o GPS do dispositivo"
- Solução: Ativar localização nas configurações do dispositivo

**Problema 4: Cidade não encontrada**
- Mensagem: "Não foi possível identificar sua cidade"
- Solução: Buscar manualmente digitando o nome da cidade

## 🔍 Logs de Debug

O sistema gera logs no console para debug:

```javascript
console.log('Current permission status:', permission);
console.log('Requesting location permission...');
console.log('Permission request result:', requested);
console.log('Geolocation error:', error);
```

Para visualizar no Android Studio:
- Abra o **Logcat**
- Filtre por "chromium" ou "console"

## 🌍 API de Geocodificação

O sistema usa **Nominatim (OpenStreetMap)**:
```
https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json
```

Resposta esperada:
```json
{
  "address": {
    "city": "Parauapebas",
    "town": null,
    "municipality": "Parauapebas",
    "state": "Pará"
  }
}
```

## 📊 Banco de Dados

- Total de cidades: **5.570**
- Todas as cidades brasileiras (IBGE)
- Estados: 27 (incluindo DF)

## 🧪 Teste Manual de Busca

Após build, você pode testar a busca de cidades:

1. Digite "parauapebas" → Deve aparecer "Parauapebas, PA"
2. Digite "são paulo" → Deve aparecer várias cidades com "São Paulo"
3. Digite "PA" → Deve aparecer cidades do Pará

## ✨ Melhorias Implementadas

### Busca Otimizada
- Busca no servidor (não carrega todas cidades)
- Debounce de 300ms
- Prioriza cidades que começam com o termo
- Limite de 50 resultados

### Feedback Visual
- Loading: "Detectando localização..."
- Sucesso: Cidade destacada com "✓ Selecionada"
- Mensagem dinâmica orientando próximos passos

### Performance
- Busca assíncrona
- Não bloqueia UI
- Timeout configurável (27 segundos)

## 📝 Checklist de Teste

- [ ] Permissão de localização é solicitada
- [ ] Coordenadas são obtidas com sucesso
- [ ] Cidade é identificada corretamente
- [ ] Campo de cidade é preenchido automaticamente
- [ ] Botão "Próximo" é habilitado
- [ ] Toast de sucesso aparece
- [ ] Busca manual funciona digitando
- [ ] Resultados são filtrados corretamente
- [ ] Sistema funciona em web E mobile

## 🚀 Próximos Passos

Após testar, você pode:
1. Gerar APK de release
2. Testar em dispositivos reais
3. Validar em diferentes localizações
4. Verificar logs para possíveis erros

---

**Status**: ✅ Pronto para teste
**Build**: Concluído com sucesso
**Capacitor**: Pronto para sincronização
