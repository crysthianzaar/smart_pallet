This# SmartPallet - Sistema de Gestão de Paletes

Sistema inteligente de gestão de paletes com IA para conferência automatizada e controle de qualidade.

## 🚀 Funcionalidades

- ✅ **Criação de paletes** com QR Code automático
- ✅ **Captura de fotos** (3 vistas: frontal, lateral, superior)
- ✅ **Contagem assistida por IA** com conferência manual quando necessário
- ✅ **Manifesto digital** e exportação PDF automatizada
- ✅ **Recebimento no destino** com comparação origem×destino
- ✅ **Dashboard com KPIs** e relatórios de diferenças
- ✅ **Auditoria completa** de todas as operações
- ✅ **PWA** - Funciona offline e pode ser instalado como app

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 14** (App Router) com TypeScript
- **Tailwind CSS** + **Shadcn/UI** para interface moderna
- **Zustand** para gerenciamento de estado
- **React Hook Form** + **Zod** para formulários e validação
- **@zxing/browser** para scanner QR Code
- **Chart.js** para gráficos e dashboards

### Backend (Clean Architecture)
- **Next.js Route Handlers** e **Server Actions**
- **Clean Architecture** com separação rigorosa de camadas
- **Firebase Admin SDK** para operações server-side
- **Zod** para validação de dados

### Firebase Services
- **Firebase Auth** para autenticação e roles
- **Firestore** como banco de dados NoSQL
- **Firebase Storage** para imagens e arquivos
- **Cloud Functions** para jobs (PDF, export, IA stub)

### PWA & Mobile
- **Service Worker** para funcionalidade offline
- **Web App Manifest** para instalação como app nativo
- **Firestore offline persistence**
- **Touch-friendly** interface para dispositivos móveis

## 🏗️ Arquitetura Clean Architecture

O projeto segue rigorosamente os princípios da Clean Architecture:

```
src/
├── app/                    # Next.js App Router (páginas e API routes)
│   ├── api/               # Route Handlers (entry points)
│   ├── (pages)/           # Páginas da aplicação
│   └── globals.css        # Estilos globais
├── server/                # Camadas do backend
│   ├── use_cases/         # Entry points dos endpoints (orquestra)
│   ├── tasks/             # Regras de negócio (funções puras)
│   ├── models/            # Entidades, DTOs e schemas Zod
│   ├── repo/              # Interfaces de repositório
│   └── adapters/
│       └── firebase/      # Implementação Firebase dos repositórios
├── modules/               # UI components organizados por domínio
├── components/            # Componentes reutilizáveis (Shadcn/UI)
├── lib/                   # Utilitários, configurações e helpers
└── functions/             # Firebase Cloud Functions
```

### Separação de Responsabilidades

- **API Routes**: Apenas validação (Zod) e delegação para use cases
- **Use Cases**: Entry points que injetam repositórios e chamam tasks
- **Tasks**: Regras de negócio puras (sem dependências de IO)
- **Repositories**: Interfaces + implementação Firebase
- **Models**: Entidades e validação com Zod

## ⚙️ Configuração e Instalação

### 1. Pré-requisitos
- Node.js 20+
- npm ou yarn
- Conta Firebase

### 2. Instalar Dependências

```bash
# Dependências principais
npm install

# Dependências das Cloud Functions
cd functions && npm install && cd ..
```

### 3. Configurar Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative os serviços:
   - **Authentication** (Email/Password)
   - **Firestore Database**
   - **Storage**
   - **Functions**
3. Copie `env.example` para `.env.local` e configure:

```env
# Firebase Client (público)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin (privado)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"

# Configurações da aplicação
IA_CONF_THRESHOLD=0.65
DELTA_ALERT=2
DELTA_CRITICAL=5
FEATURE_PDF_EXPORT=true
FEATURE_IA_STUB=true
```

### 4. Configurar Emuladores (Desenvolvimento)

```bash
# Instalar Firebase CLI globalmente
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto (se necessário)
firebase init
```

### 5. Executar em Desenvolvimento

```bash
# Terminal 1: Next.js (porta 3000)
npm run dev

# Terminal 2: Firebase Emulators (porta 4000 para UI)
npm run firebase:emulators
```

Acesse:
- **App**: http://localhost:3000
- **Firebase UI**: http://localhost:4000

## 📱 Fluxo de Uso Completo

### 1. 📦 Criação de Palete
1. Acessar "Criar Palete"
2. Selecionar contrato e localização de origem
3. Adicionar SKUs (máximo 2 por palete - regra de negócio)
4. Sistema gera QR Code automaticamente: `PALLET:{id};CONTRACT:{contractId}`

### 2. 📷 Captura de Fotos
1. Escanear QR Code do palete
2. Capturar 3 vistas obrigatórias:
   - **Frontal**: Vista frontal do palete
   - **Lateral**: Vista lateral do palete  
   - **Superior**: Vista superior do palete
3. Upload automático para Firebase Storage
4. Compressão client-side antes do upload

### 3. 🤖 Contagem Assistida por IA
1. IA processa as fotos e sugere quantidades (stub atual)
2. Sistema calcula confiança global baseada em:
   - Presença de fotos (3 vistas)
   - Qualidade das imagens
   - Algoritmos de detecção (TODO: IA real)
3. **Se confiança < 65%**: força conferência manual
4. Usuário pode ajustar quantidades manualmente
5. Sistema bloqueia selagem até confirmação manual se necessário

### 4. 🔒 Selagem do Palete
1. Validar regra de negócio: máximo 2 SKUs por palete
2. Se baixa confiança: confirmar conferência manual obrigatória
3. Aplicar ajustes manuais nas quantidades
4. Selar palete (status: `rascunho` → `selado`)
5. Registrar auditoria completa

### 5. 📋 Manifesto Digital
1. Criar manifesto com origem e destino
2. Adicionar apenas paletes com status `selado`
3. Validar que paletes pertencem ao mesmo contrato/origem
4. Marcar manifesto como "carregado"
5. Atualizar status dos paletes: `selado` → `em_transporte`
6. Exportar PDF via Cloud Function

### 6. 📥 Recebimento no Destino
1. Escanear QR Code do palete no destino
2. Capturar fotos de recebimento (evidências)
3. Inserir quantidades realmente recebidas por SKU
4. Sistema compara automaticamente origem × destino
5. Status do palete: `em_transporte` → `recebido`

### 7. ⚖️ Comparação e Gestão de Divergências

O sistema classifica automaticamente as diferenças:

- **🟢 OK**: Delta < 2 unidades
- **🟡 Alerta**: Delta 2-4 unidades 
  - **Motivo obrigatório**
- **🔴 Crítico**: Delta ≥ 5 unidades
  - **Motivo obrigatório**
  - **Evidências opcionais** (fotos/documentos)

## 🎯 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                    # Next.js dev server
npm run firebase:emulators     # Firebase emulators

# Produção
npm run build                  # Build otimizado
npm run start                  # Servidor produção
npm run firebase:deploy        # Deploy Firebase

# Testes
npm run test                   # Vitest
npm run test:ui               # Vitest UI
npm run test:e2e              # Playwright E2E

# Linting
npm run lint                  # ESLint
```

## 🔐 Segurança e Permissões

### Roles de Usuário
- **Admin**: CRUD completo em todas as entidades
- **Conferente**: Leitura global + escrita controlada em paletes/manifestos

### Firestore Security Rules
```javascript
// Exemplo de regra para paletes
match /pallets/{palletId} {
  allow read: if hasAnyRole();
  allow create: if hasAnyRole();
  allow update: if hasAnyRole() && 
    (resource.data.status == 'rascunho' || 
     request.auth.uid == resource.data.sealedBy);
}
```

### Storage Security Rules
- Apenas usuários autenticados com roles válidas
- Tipos permitidos: `image/*`, `application/pdf`
- Limite de 15MB por arquivo
- Estrutura organizada por entidade

## 📊 Dashboard e KPIs

### Métricas Principais
- **Total de paletes** processados
- **% de baixa confiança** (requer conferência manual)
- **Divergência média** entre origem e destino
- **Diferenças críticas** e alertas
- **Top SKUs** com mais divergências

### Relatórios
- **Lista de diferenças** com filtros avançados
- **Export CSV** de divergências
- **Auditoria completa** de operações
- **Gráficos temporais** de performance

## 🔧 Configurações Avançadas

### Variáveis de Ambiente Completas

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Business Rules
IA_CONF_THRESHOLD=0.65        # Limite confiança IA (0-1)
DELTA_ALERT=2                 # Limite para alerta
DELTA_CRITICAL=5              # Limite para crítico

# Feature Flags
FEATURE_PDF_EXPORT=true       # Habilitar export PDF
FEATURE_IA_STUB=true          # Usar IA stub (dev)

# Next.js
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

### Configuração de Índices Firestore

O arquivo `firestore.indexes.json` contém índices otimizados para:
- Consultas por contrato + data
- Filtros por status + data
- Auditoria por entidade + timestamp
- Comparações por status e período

## 🚀 Deploy em Produção

### 1. Build e Deploy
```bash
# Build da aplicação
npm run build

# Deploy completo (Hosting + Functions + Rules)
npm run firebase:deploy

# Deploy específico
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

### 2. Configuração de Domínio
1. Configure domínio customizado no Firebase Hosting
2. Atualize `NEXTAUTH_URL` para o domínio de produção
3. Configure CORS no Firebase se necessário

### 3. Monitoramento
- **Firebase Console**: Logs e métricas
- **Performance Monitoring**: Ativado automaticamente
- **Crashlytics**: Para apps móveis (futuro)

## 🛣️ Roadmap e TODOs

### 🔄 Próximas Funcionalidades (Semana 3-4)
- [ ] **IA Real**: Substituir stub por integração real de visão computacional
- [ ] **Otimização de Imagens**: Web Workers para processamento client-side
- [ ] **PDF Avançado**: Logo, branding, numeração de páginas
- [ ] **Paginação**: Implementar para queries grandes (>1000 registros)
- [ ] **Testes E2E**: Cobertura completa do fluxo crítico

### 🔧 Melhorias Técnicas
- [ ] **Cache Redis**: Para performance em produção
- [ ] **Índices Compostos**: Otimização de queries complexas
- [ ] **Compressão Avançada**: Algoritmos de compressão de imagem
- [ ] **Sync Offline**: Sincronização bidirecional avançada
- [ ] **Push Notifications**: Para atualizações de status

### 📱 Mobile e UX
- [ ] **App Nativo**: React Native ou Capacitor
- [ ] **Biometria**: Autenticação por impressão digital
- [ ] **Modo Escuro**: Theme switcher
- [ ] **Acessibilidade**: WCAG 2.1 compliance
- [ ] **Internacionalização**: Suporte multi-idioma

## 🐛 Troubleshooting

### Problemas Comuns

**1. Erro de autenticação Firebase**
```bash
# Verificar configuração
firebase projects:list
firebase use your-project-id
```

**2. Emuladores não iniciam**
```bash
# Limpar cache
firebase emulators:exec --only firestore "echo 'test'" --project demo-test
```

**3. Build falha**
```bash
# Limpar cache Next.js
rm -rf .next
npm run build
```

**4. Dependências não encontradas**
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Logs e Debug
- **Firebase Console**: https://console.firebase.google.com
- **Emulator UI**: http://localhost:4000
- **Next.js**: Logs no terminal de desenvolvimento
- **Cloud Functions**: Firebase Console > Functions > Logs

## 📄 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.

---

**SmartPallet** - Desenvolvido com ❤️ usando Next.js 14, Firebase e Clean Architectures.
