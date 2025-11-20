
# ⚙️ OilSmart: Sistema Inteligente de Agendamento para Oficinas

O **OilSmart** é um sistema completo para agendamento e gestão de serviços em oficinas de troca de óleo e manutenção veicular. O projeto possui dois perfis de acesso: **Cliente (Mobile & Web)** e **Administrador / adm-oficina (Web/API)**.

---

## 🚀 Tecnologias Utilizadas

| Componente         | Tecnologia                    | Observações                                                                        |
| ----------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| **Backend**        | Node.js + Express             | API REST, middlewares, rotas em `routes/`                                          |
| **Banco de Dados** | MySQL (mysql2)                | Esquema em `database/oil.sql`, conexão em `database/db.js`                         |
| **Mobile**         | React Native + Expo           | App cliente (pasta `mobile/`)                                                      |
| **Frontend (Web)** | HTML / CSS / JS               | Páginas estáticas em `public/html/` usadas pelo cliente e painel administrativo     |
| **Autenticação**   | bcryptjs, express-session     | Senhas com bcrypt; sessões para admins; JWT em fluxos opcionais                   |
| **Emails**         | nodemailer                    | Transporter configurável via variáveis de ambiente                                 |

---

## ✨ Funcionalidades e Fluxo de Navegação

### 1. Cliente (Mobile)

O cliente acessa o aplicativo via **Login/Cadastro**:

- **Autenticação:** login e cadastro (validação básica no frontend e backend)
- **Tela Inicial:** tutorial e widget chatbot
- **Agendamento de Serviços:**
  - Serviços: troca de óleo, filtro, etc.
  - Fluxo em 4 etapas: Veículo → Serviços → Data/Hora → Confirmação (gera protocolo)
- **Minha Agenda:** histórico de agendamentos com status e opção de cancelar
- **Suporte:** formulário de contato / mensagens vinculadas ao agendamento
- **Outras telas:** FAQ, políticas e sobre

> ⚠️ O app mobile está em `mobile/` — rode-o separadamente (veja seção de execução).

---

### 2. Administrador / adm-oficina (Web/API)

O painel admin provê controle de operações da oficina:

#### A. Configurações da Oficina

- Horário de funcionamento e dias ativos
- Intervalo entre agendamentos (30m/45m/60m/90m/120m)
- Capacidade simultânea por horário
- Dados de contato e endereço

#### B. Dashboard

- Visualização de métricas: agendamentos do dia, status por categoria, relatórios simples

#### C. Gerenciamento de Agendamentos

- Filtros por status, cliente, veículo, data e protocolo
- CRUD completo sobre agendamentos

#### D. Gestão de Produtos e Catálogo

- CRUD para `produto_oleo` e `produto_filtro`
- Vinculação de produtos a modelos/anos (recomendação)

---

### 3. Observações de arquitetura e manutenção

- Atualmente o `server.js` concentra muitas rotas; ideal migrar para controllers + services
- Próximos passos técnicos sugeridos: modularização, validação com Joi, testes unitários e integração contínua

---

### 4. Resumo Mobile x Web

| Perfil                        | Funcionalidades Principais                                        |
| ----------------------------- | ---------------------------------------------------------------- |
| **Cliente (Mobile)**          | Agendamento, histórico, suporte, recomendações por veículo       |
| **Administrador / adm-oficina** | Dashboard, CRUD de agendamentos, gestão de produtos e configurações |

---

## 📂 Estrutura do Projeto (resumo)

OilSmartnovo/

- `server.js` — entrada do backend
- `database/` — `db.js` (conexão) e `oil.sql` (esquema)
- `routes/` — definições das rotas Express
- `public/` — frontend estático (HTML/CSS/JS) para painel e site público
- `mobile/` — app React Native + Expo (cliente)
- `fix-passwords.js` — script utilitário para atualizar senhas via bcrypt
- `docs/` — documentação extra (`ARCHITECTURE.md`, `ENDPOINTS.md`)

---

## 🛠️ Como Rodar Localmente

Pré-requisitos: Node.js e MySQL.

1) Instalar dependências (no root):

```powershell
npm install
```

2) Configurar banco de dados:

- Edite `database/db.js` com suas credenciais (host, user, password, database).
- Importe o esquema:

```powershell
mysql -u <usuario> -p < database/oil.sql
```

3) Variáveis de ambiente (opcionais / recomendadas)

- `PORT` — porta do servidor (padrão 3000)
- `SESSION_SECRET` — segredo da sessão
- `EMAIL_USER`, `EMAIL_PASS` — para `nodemailer` (se usado)

4) Iniciar servidor:

```powershell
node server.js
```

Servidor padrão: `http://localhost:3000`.

5) Rodar mobile (opcional):

```powershell
cd mobile
npm install
npx expo start
```

Se testar no dispositivo, exponha a API com `ngrok http 3000` e atualize `baseURL` no cliente mobile.

---

## 🔌 Endpoints (resumo técnico)

Consulte `docs/ENDPOINTS.md` para a lista completa; abaixo estão os endpoints mais usados.

- `POST /api/auth/login` — { email, senha }
- `POST /api/auth/register` — cadastro de usuário
- `POST /api/auth/forgot-password` — solicitar reset
- `POST /api/auth/reset-password` — redefinir senha

- `GET /api/oficina` — listar oficinas (filtros por cidade/estado)
- `GET /api/oficina/:id` — dados da oficina
- `GET /api/oficina/:id/capacidade` — capacidade/configuração

- `POST /api/agendamento` — criar agendamento
- `GET /api/agendamento` — listar (filtros)
- `GET /api/agendamento/:id` — obter por id
- `PUT /api/agendamento/:id` — atualizar
- `POST /api/agendamento/:id/cancelar` — cancelar

Exemplo rápido (curl) — login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@exemplo.com","senha":"123456"}'
```

Exemplo — criar agendamento (JSON simplificado):

```bash
curl -X POST http://localhost:3000/api/agendamento \
  -H "Content-Type: application/json" \
  -d '{"usuario_id":1,"oficina_id":2,"servicos":[{"id":1,"quantidade":1}],"data":"2025-12-01","hora":"10:00"}'
```

---

## 🧰 Scripts e utilitários

- `fix-passwords.js` — atualiza senhas de usuários do tipo `oficina` para uma senha padrão (gera hash bcrypt). Use com cautela.
- `docs/` — documentação gerada: arquitetura e endpoints resumidos.

---

## ✅ Boas práticas e recomendações

- Não comitar `.env` ou credenciais no repositório.
- Use senha de app para Gmail ou provedor SMTP dedicado para `nodemailer`.
- Considere refatorar `server.js` em módulos (rotas/controllers/services) antes de escalar.

---

## 👤 Autor

- Raphael Pires — [LinkedIn](https://www.linkedin.com/in/raphael-pires-516a6b369)


