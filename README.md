
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

### 1. Cliente (Mobile & Web)

O cliente pode usar o sistema via aplicativo móvel (React Native / Expo) ou via páginas web públicas (HTML/CSS/JS em `public/html/`). Ambos os meios oferecem o mesmo fluxo funcional principal:

- **Autenticação:** login e cadastro (validação no frontend e backend)
- **Tela Inicial / Landing:** tutorial, informações e widget chatbot (quando disponível)
- **Agendamento de Serviços:**
  - Serviços: troca de óleo, filtro, revisões, serviços adicionais
  - Fluxo em 4 etapas: Veículo → Serviços → Data/Hora → Confirmação (gera protocolo)
- **Minha Agenda / Histórico:** listar agendamentos, ver detalhes, cancelar quando permitido
- **Suporte / Contato:** formulário de contato, envio de mensagens vinculadas ao agendamento
- **Páginas Web principais:** `index.html`, `servicos.html`, `agenda.html`, `cadastro.html`, `login.html`, `contato.html`, `politicas.html`, `sobre.html` (localizadas em `public/html/`)

Observação: o app mobile está em `mobile/` e as páginas web do cliente em `public/html/`. Ao testar em dispositivo físico, exponha a API local (ex.: `ngrok`) ou use a rede local.

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

### 3. Problema Atual e Refatoração Futura do Backend

O backend atual está **concentrado em um único arquivo (`server.js`) com mais de 3.700 linhas**, o que dificulta a manutenção e escalabilidade.

**Planejamento de melhorias:**

- **Refatoração e Modularização:** Separar rotas, controllers e services para responsabilidades claras e testes mais simples.
- **Padrão MVC:** Reestruturar código em Models, Views (para o frontend se aplicável) e Controllers para facilitar manutenção e integração futura.
- **Testes Unitários e de Integração:** Adotar testes automatizados (Jest, Mocha/Chai) para garantir regressões controladas e qualidade do código.
- **Validação de Dados:** Implementar validação robusta em entradas/requests usando bibliotecas como `Joi` ou `express-validator`.
- **CI/CD e Linters:** Adicionar pipeline de CI (GitHub Actions) e linters (ESLint, Prettier) para manter qualidade e estilo consistentes.

Essas ações reduzem o risco de bugs, melhoram a velocidade de desenvolvimento e facilitam a adoção de novas funcionalidades.

---

### 4. Resumo Mobile x Web

| Perfil                        | Funcionalidades Principais                                        |
| ----------------------------- | ---------------------------------------------------------------- |
| **Cliente (Mobile & Web)**    | Agendamento, histórico, suporte, recomendações por veículo       |
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

---

## ⚡ Futuros passos

Itens sugeridos para roadmap e próximas sprints:

- **Tela de administração no mobile:** implementar versão responsiva/compacta do painel administrativo dentro do app mobile para gerentes/oficinas.
- **Reestruturar o backend:** migrar `server.js` para estrutura modular (rotas/controllers/services/models) e adicionar pasta `tests/` com exemplos de testes unitários.
- **Chatbot aprimorado:** melhorar respostas e fluxos (logs, fallback, possíveis integrações com NLP leve).
- **Chatbot no mobile e administrativo:** disponibilizar o chatbot tanto no app mobile quanto no painel web, com sincronização de conversas por agendamento/oficina.
- **Gerenciar Estoque funcional:** implementar módulo de estoque (CRUD, entradas/saídas, alertas de baixo estoque) integrado ao catálogo de produtos.
- **Admin cadastrar funcionário:** adicionar funcionalidade para o admin criar/gerenciar contas de funcionários com roles/permissões para reduzir risco de sabotagem.


| ** 👤 Autores**            | **LinkedIn**                                                           | **Função / Extras**                                                            |
| ------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Raphael Pires**   | [LinkedIn](https://www.linkedin.com/in/raphael-pires-516a6b369)        | Front e Backend — Web Cliente, Painel Admin e Mobile — **Documentação (Word)** |
| **Diego Ferreira**  | [LinkedIn](https://www.linkedin.com/in/diego-silva-ferreira-a81b66147) | Front-end — Painel Admin (Web) — **Documentação (Word)**                       |
| **Leonardo Hantke** | [LinkedIn](https://www.linkedin.com/in/leonardo-hantke)                | Front-end — Painel Admin (Web)                                                 |
| **Pedro Cremonezi** | [LinkedIn](https://www.linkedin.com/in/pedro-cremonezi-4213a9285)      | Front-end Mobile — App Cliente (React Native)                                  |
| **Luis Barão**      | [LinkedIn](https://www.linkedin.com/in/luis-santos-62b97739a)          | Backend — Web Cliente                                                          |







