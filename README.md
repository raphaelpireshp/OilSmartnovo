# ⚙️ OilSmartnovo: Sistema Inteligente de Agendamento para Oficinas

O **OilSmartnovo** é um sistema completo desenvolvido para otimizar o processo de agendamento e gestão de serviços em oficinas de troca de óleo e manutenção veicular.  

O projeto possui dois perfis de acesso: **Cliente (Mobile)** e **Administrador / adm-oficina (Web/API)**.

---

## 🚀 Tecnologias Utilizadas

| Componente         | Tecnologia                    | Detalhes                                                                            |
| ----------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| **Backend**        | Node.js + Express             | Servidor RESTful para lógica de negócios e administração                             |
| **Banco de Dados** | MySQL                         | Armazenamento de usuários, oficinas, agendamentos e configurações                  |
| **Mobile**         | React Native + Expo           | Aplicativo móvel para clientes, focado em agendamento e acompanhamento de serviços |
| **Autenticação**   | bcryptjs, express-session     | Segurança no armazenamento de senhas e gestão de sessões administrativas           |

---

## ✨ Funcionalidades e Fluxo de Navegação

### 1. Cliente (Mobile)

O cliente acessa o aplicativo via **Login/Cadastro**:

- **Autenticação:** Login e cadastro de usuários com validação de campos  
- **Tela Inicial:** Tutorial e Chatbot para dúvidas  
- **Agendamento de Serviços:**  
  - Serviços: Troca de óleo, filtro, etc.  
  - Agenda em 4 etapas: Veículo → Serviços → Data/Hora → Confirmação (gera protocolo)  
- **Minha Agenda:** Histórico de agendamentos e cancelamentos  
- **Suporte:** Histórico de mensagens e contato com a oficina  
- **Outras Telas:** "Nossa História" e "Ajuda/Suporte"  

> ⚠️ Para rodar o mobile, trate-o como projeto **separado**. Copie a pasta `mobile/` para outro diretório antes de instalar dependências.

---

### 2. Administrador / adm-oficina (Web/API)

O administrador acessa via Web/API com login seguro:

#### A. Configurações da Oficina

- **Horário de Funcionamento:** Definir horário comercial diário  
- **Intervalo Entre Agendamentos / Duração do Serviço:**  
  - 30 min → Serviço rápido  
  - 45 min → Serviço padrão  
  - 1 h → Serviço completo  
  - 1h30 → Serviço + revisão  
  - 2 h → Serviço completo + detalhes  
- **Capacidade de Atendimento:** Quantidade de clientes simultâneos  
- **Dias de Funcionamento:** Segunda a Domingo (ativo/fechado)  
- **Informações da Oficina:** Nome, telefone, endereço  
- **Preview do Horário:** Visualização automática dos horários configurados  

#### B. Dashboard

- Métricas em tempo real: agendamentos do dia, último agendamento, resumo mensal  
- Status atual: Pendentes, Confirmados, Cancelados  
- Notificações de novos agendamentos ou ações recentes  
- Ações rápidas: Acesso à lista de agendamentos, conclusão por protocolo e relatórios  

#### C. Gerenciamento de Agendamentos (CRUD)

- Filtros: Status, período, cliente, telefone, veículo, serviço, protocolo  
- CRUD completo: Criação, leitura, atualização e exclusão de agendamentos  
- Conclusão rápida por protocolo: ex. `OIL20231201-001`  

#### D. Sistema de Gerenciamento OilSmart (Admin Completo)

- **Módulos:** Produtos, Oficinas, Marcas, Modelos, Anos  
- **Integração:** Conectividade total entre agendamentos, clientes, veículos e serviços  

---

### 3. Resumo Mobile x Web

| Perfil                        | Funcionalidades Principais                                        |
| ----------------------------- | ---------------------------------------------------------------- |
| **Cliente (Mobile)**          | Serviços, agendamento, login/criação de conta, suporte           |
| **Administrador / adm-oficina** | CRUD de agendamentos, dashboard, relatórios, configuração da oficina, gestão de produtos, marcas, modelos e anos |

---

## 📂 Estrutura do Projeto

OilSmartnovo/
├── database/ # Scripts SQL (oil.sql) e conexão com o banco (db.js)
├── mobile/ # Projeto React Native/Expo
│ ├── src/ # Telas e componentes
│ └── README.md # Documentação mobile
├── routes/ # Rotas modularizadas do Express
├── public/ # Arquivos estáticos
├── server.js # Servidor Node.js/Express
└── README.md # Este arquivo


---

## 🛠️ Como Rodar Localmente

### Backend

```bash
git clone https://github.com/raphaelpireshp/OilSmartnovo
cd OilSmartnovo
npm install


Configure o banco de dados no .env

Execute database/oil.sql

npm start
# Backend rodando em http://localhost:3000


Exponha via ngrok para acesso mobile:

ngrok http 3000


Atualize a URL base da API dentro do mobile.

Mobile (React Native / Expo)
cd mobile
npm install
npx expo start


Escaneie o QR Code com Expo Go

Configure a URL do backend (ngrok) dentro do projeto

💡 Próximos Passos e Melhorias

Refatoração do Backend (modularização, MVC, controllers, services)

Testes unitários para rotas e lógica de agendamento

Validação de dados robusta (ex: Joi)

👤 Autor

Raphael Pires - https://www.linkedin.com/in/raphael-pires-516a6b369

📄 Licença

Privado - pertence ao OilSmart.
