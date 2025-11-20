# OilSmart — Arquitetura (visão geral)

Este documento descreve, de forma simples, a arquitetura do sistema OilSmart: como o app mobile, o servidor/API e o banco de dados se relacionam.

Componentes principais

- Mobile (React Native / Expo)
  - Localizado em `mobile/`
  - Telas consomem a API REST do backend e apresentam fluxo de agendamento ao usuário

- Backend (Node.js + Express)
  - Arquivo principal: `server.js`
  - Rotas em `routes/` (ex.: `auth.js`, `agendamentoSimples.js`, `oficina.js`, `adminRoutes.js`)
  - Autenticação: `bcryptjs`, `express-session` (sessões para admins); JWT usado em alguns fluxos

- Banco de dados (MySQL)
  - Esquema em `database/oil.sql`
  - Conexão em `database/db.js`

Fluxo de dados (resumido)

Mobile UI -> API (Express) -> MySQL

1. O usuário no mobile preenche formulário (login, cadastro, agendamento).
2. O mobile envia requisição HTTP para o backend (`/api/*`).
3. O backend processa, valida e persiste dados no MySQL.
4. Backend retorna resposta ao mobile; ações adicionais podem disparar email via `nodemailer`.

Diagrama ASCII simples

```
+---------+     HTTPS/HTTP     +---------+     SQL      +-------+
|  Mobile |  ----------------> | Backend |  ----------> | MySQL |
| (Expo)  |                    | (Express)|             |       |
+---------+ <----------------  +---------+ <----------  +-------+
     |  (GET/POST/PUT/DELETE)       |  (queries/result)
     |                             |
     v                             v
 Frontend web                  Admin Panel
 (public/)                     (admindex.html + admin_geral.html)
```

Observações

- Em desenvolvimento local, é comum expor o backend com `ngrok` para que o app mobile (no dispositivo) acesse a API.
- Revisar `server.js` e rotas para separação por controllers/services quando for refatorar (melhor prática).

---

Quer que eu gere também um diagrama em PNG/SVG simples (texto → imagem) ou mantenha apenas o `ARCHITECTURE.md` em texto?