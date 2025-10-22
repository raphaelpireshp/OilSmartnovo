# OilSmart Mobile - React Native

Aplicativo móvel para agendamento de troca de óleo desenvolvido em React Native com Expo.

## 📱 Funcionalidades

- ✅ Login e Registro de usuários
- ✅ Agendamento de serviços em 4 etapas
- ✅ Visualização de agendamentos
- ✅ Sistema de suporte
- ✅ Armazenamento local com AsyncStorage
- ✅ Navegação por abas

## 🚀 Como Rodar no Expo Go

### 1. Instalar o Expo Go no seu celular

- **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)

### 2. Instalar dependências

\`\`\`bash
npm install
\`\`\`

### 3. Iniciar o projeto

\`\`\`bash
npx expo start
\`\`\`

### 4. Escanear o QR Code

- **Android**: Abra o Expo Go e escaneie o QR Code que aparece no terminal
- **iOS**: Abra a câmera do iPhone e escaneie o QR Code

## 📦 Estrutura do Projeto

\`\`\`
oilsmart-mobile/
├── App.js                      # Navegação principal
├── src/
│   └── screens/
│       ├── LoginScreen.js      # Tela de login
│       ├── RegisterScreen.js   # Tela de cadastro
│       ├── ServicosScreen.js   # Agendamento (4 etapas)
│       ├── AgendaScreen.js     # Lista de agendamentos
│       └── SuporteScreen.js    # Suporte/mensagens
├── app.json                    # Configuração do Expo
├── package.json                # Dependências
└── README.md                   # Este arquivo
\`\`\`

## 🎨 Telas

### 1. Login / Registro
- Autenticação com email e senha
- Validação de campos
- Armazenamento seguro de credenciais

### 2. Serviços (4 Etapas)
- **Etapa 1**: Dados do veículo e localização
- **Etapa 2**: Seleção de produtos/serviços
- **Etapa 3**: Data, horário e dados pessoais
- **Etapa 4**: Confirmação do agendamento

### 3. Agenda
- Lista de agendamentos
- Filtros por status (Todos, Confirmado, Cancelado)
- Cancelamento de agendamentos

### 4. Suporte
- Envio de mensagens
- Histórico de mensagens

## 💾 Armazenamento

O app usa AsyncStorage para armazenar:
- `oilsmart_users`: Lista de usuários cadastrados
- `oilsmart_current_user`: Usuário logado
- `oilsmart_agendamentos`: Lista de agendamentos
- `oilsmart_suporte`: Mensagens de suporte

## 🎨 Design

- **Cores**: Amarelo (#eab308) e tons de cinza/azul escuro
- **Tema**: Dark mode
- **Tipografia**: Sistema padrão
- **Ícones**: Ionicons (@expo/vector-icons)

## 📝 Notas

- Este é um app offline que usa apenas armazenamento local
- Para produção, você precisará integrar com uma API backend
- As imagens de ícone/splash precisam ser adicionadas na pasta `assets/`

## 🔧 Tecnologias

- **React Native**: 0.76.5
- **Expo**: ~52.0.0
- **React Navigation**: 6.x
- **AsyncStorage**: 2.1.0
- **Ionicons**: 14.0.0

## 📄 Licença

Este projeto é privado e pertence ao OilSmart.
