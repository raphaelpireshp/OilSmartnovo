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

