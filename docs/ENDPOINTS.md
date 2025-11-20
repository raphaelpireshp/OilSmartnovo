# OilSmart — Endpoints principais (resumo)

Este documento lista os endpoints mais relevantes do backend. Use-o como referência rápida; para detalhes confira os arquivos em `routes/`.

Observação: assumir prefixo `/api` dependendo do mapeamento em `server.js`.

## Autenticação (`routes/auth.js`)

- POST `/api/auth/login`
  - Body: `{ email, senha }`
  - Retorno: token/session e dados do usuário

- POST `/api/auth/register`
  - Body: `{ nome, email, senha, ... }`

- POST `/api/auth/forgot-password`
  - Body: `{ email }` — envia link/token de recuperação

- POST `/api/auth/reset-password`
  - Body: `{ token, novaSenha }` — redefine a senha

## Oficinas

- GET `/api/oficina` — lista oficinas (opcional: filtros por cidade/estado)
- GET `/api/oficina/:id` — obter dados de uma oficina específica
- GET `/api/oficina/:id/capacidade` — retorna capacidade/configuração da oficina
- GET `/api/oficina/:id/horario-especial/:data` — horários especiais para data

## Agendamentos (`routes/agendamentoSimples.js`)

- POST `/api/agendamento` — criar novo agendamento
- GET `/api/agendamento/:id` — obter agendamento por id
- GET `/api/agendamento` — listar agendamentos (filtros aplicáveis)
- GET `/api/agendamento/usuario/:usuario_id` — agendamentos por usuário
- PUT `/api/agendamento/:id` — atualizar agendamento
- DELETE `/api/agendamento/:id` — deletar agendamento
- POST `/api/agendamento/:id/cancelar` — cancelar agendamento
- POST `/api/agendamento/atualizar-status/automatico` — endpoint para atualizações automáticas

## Admin (oficinas / produtos)

- GET `/api/admin/oficinas` — listar oficinas (requer sessão admin)
- POST `/api/admin/oficinas` — criar oficina
- DELETE `/api/admin/oficinas/:id` — deletar oficina

- Produtos (óleo):
  - GET `/api/admin/produtos/oleo`
  - POST `/api/admin/produtos/oleo`
  - PUT `/api/admin/produtos/oleo/:id`
  - DELETE `/api/admin/produtos/oleo/:id`

- Produtos (filtro):
  - GET `/api/admin/produtos/filtro`
  - POST `/api/admin/produtos/filtro`
  - PUT `/api/admin/produtos/filtro/:id`
  - DELETE `/api/admin/produtos/filtro/:id`

- Configurações de capacidade/intervalo: PUT/GET em rotas de `adminRoutes.js` (ex.: `/api/admin/configuracoes/capacidade`)

## Recomendações

- GET `/api/recomendacao?modelo_ano_id=123` — retorna óleo/filtro recomendado para o veículo
- GET `/api/recomendacao/por-veiculo?marca=...&modelo=...&ano=...` — busca por parâmetros de veículo

## Geocoding

- GET `/api/geocode?address=...` — usa Nominatim (OpenStreetMap) para obter lat/lng e endereço

## Exemplos rápidos (curl)

Login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","senha":"123456"}'
```

Criar agendamento (exemplo):

```bash
curl -X POST http://localhost:3000/api/agendamento \
  -H "Content-Type: application/json" \
  -d '{"usuario_id":1,"oficina_id":2,"servicos":[{"id":1,"quantidade":1}],"data":"2025-12-01","hora":"10:00"}'
```

---

Observação final: confirme o prefixo de rotas em `server.js` (`/api` ou raiz) e ajuste os paths conforme necessário. Para um inventário completo, posso gerar automaticamente um `ENDPOINTS_FULL.md` lendo `routes/` e listando todos os handlers com métodos HTTP.
