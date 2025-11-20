# ⚙️ OilSmartnovo: Solução Full-Stack de Agendamento para Oficinas

O **OilSmartnovo** é um sistema completo desenvolvido para otimizar o processo de agendamento e gestão de serviços em oficinas de troca de óleo e manutenção veicular.

O projeto é dividido em duas partes principais: um **Backend** robusto para gestão e APIs, e um **Aplicativo Mobile** para o cliente final.

## 🚀 Tecnologias Utilizadas (Tech Stack)

O projeto utiliza um *stack* moderno e amplamente utilizado no mercado, demonstrando proficiência em desenvolvimento Full-Stack.

| Componente | Tecnologia | Detalhes |
| :--- | :--- | :--- |
| **Backend** | **Node.js** com **Express** | Servidor de API RESTful para a lógica de negócios e administração. |
| **Banco de Dados** | **MySQL** | Armazenamento de dados de usuários, oficinas, agendamentos e configurações. |
| **Mobile** | **React Native** com **Expo** | Aplicativo móvel para clientes, focado em agendamento e acompanhamento de serviços. |
| **Autenticação** | `bcryptjs`, `express-session` | Segurança no armazenamento de senhas e gestão de sessões administrativas. |

## ✨ Principais Funcionalidades

### Backend / Administração
*   **Autenticação Segura:** Login e gestão de sessão para administradores de oficina.
*   **Gestão de Agendamentos:** Visualização, filtragem e alteração de status de agendamentos (pendente, confirmado, concluído).
*   **Lógica de Capacidade:** Controle de agendamentos simultâneos por oficina.
*   **Dashboard:** Métricas e visualizações de dados sobre agendamentos e receita.
*   **Configuração de Oficina:** Definição de horários de funcionamento, coordenadas e intervalos de serviço.

### Aplicativo Mobile (React Native)
*   **Cadastro e Login de Clientes**
*   **Agendamento em 4 Etapas:** Seleção de veículo, serviços, data/hora e confirmação.
*   **Visualização de Agenda** e histórico de serviços.
*   **Sistema de Suporte** (mensagens).

## 📂 Estrutura do Projeto

O repositório está organizado para separar as responsabilidades do backend e do mobile:

OilSmartnovo/
├── database/               # Scripts SQL (oil.sql) e conexão com o banco (db.js)
├── mobile/                 # Código-fonte do aplicativo React Native/Expo
│   ├── src/                # Telas e componentes do mobile
│   └── README.md           # Documentação detalhada do app mobile
├── routes/                 # (Futuramente) Rotas modularizadas do Express
├── public/                 # Arquivos estáticos (se houver)
├── server.js               # Servidor principal (Node.js/Express)
└── README.md               # Este arquivo

    
## 🛠️ Como Rodar Localmente

### 1. Backend (Node.js/Express)

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/raphaelpireshp/OilSmartnovo
    cd OilSmartnovo
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    ```
3.  **Configuração do Banco de Dados (MySQL ):**
    *   Crie um banco de dados MySQL.
    *   Configure as credenciais de acesso no arquivo `.env` (exemplo: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
    *   Execute o script `database/oil.sql` para criar as tabelas necessárias.
4.  **Inicie o servidor:**
    ```bash
    npm start
    # O servidor estará rodando em http://localhost:3000 (ou porta definida em .env )
    ```
5.  **Exponha o Backend com ngrok (Para Comunicação Mobile):**
    *   Instale e configure o ngrok.
    *   Execute o comando para expor a porta do seu servidor (padrão 3000):
        ```bash
        ngrok http 3000
        ```
    *   Copie o **URL HTTPS** gerado pelo ngrok (ex: `https://abcdef123456.ngrok-free.app` ).
    *   **Importante:** Você precisará atualizar a URL base da API no código do aplicativo mobile (geralmente em um arquivo de configuração ou constante) para este novo endereço do ngrok.

### 2. Aplicativo Mobile (React Native/Expo)

O aplicativo mobile é um projeto React Native/Expo aninhado no diretório `mobile/`. Para rodá-lo, você deve tratá-lo como um projeto separado.

1.  **Acesse o diretório mobile:**
    ```bash
    cd mobile
    ```
2.  **Instale as dependências do mobile:**
    ```bash
    npm install
    ```
3.  **Inicie o projeto Expo:**
    ```bash
    npx expo start
    ```
4.  **Siga as instruções:** O terminal irá gerar um QR Code. Use o aplicativo **Expo Go** no seu celular para escanear o código e carregar o aplicativo.
5.  **Configuração da API:** Certifique-se de que a URL do ngrok (obtida na etapa 5 do Backend) foi configurada como a URL base da API dentro do código do aplicativo mobile.

## 💡 Próximos Passos e Melhorias (Roadmap)

O projeto está funcional, mas a arquitetura do Backend, atualmente concentrada em um único arquivo (`server.js` com mais de 3.700 linhas), está **desorganizada e precisa de refatoração urgente** para garantir a escalabilidade e a manutenibilidade.

O foco do desenvolvimento agora é na **melhoria da qualidade do código e da arquitetura**:

*   **Refatoração e Modularização do Backend:** Separar rotas, *controllers* e *services* em arquivos dedicados, seguindo o padrão MVC ou similar.
*   **Testes Unitários:** Implementar testes para as principais rotas e lógicas de agendamento.
*   **Validação de Dados:** Adicionar validação de esquema mais robusta (ex: Joi) nas requisições de API.

## 👤 Autor

**Raphael Pires** - [https://www.linkedin.com/in/raphael-pires-516a6b369](https://www.linkedin.com/in/raphael-pires-516a6b369 )

## 📄 Licença

Este projeto é privado e pertence ao OilSmart.
[Adicione aqui a licença, se for o caso, como MIT ou outra.]
