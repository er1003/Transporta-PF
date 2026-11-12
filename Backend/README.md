# TransportaPF Backend

## Arquitetura

- `controllers/`: rotas HTTP/API
- `DAO/`: acesso ao banco
- `models/`: modelos de domínio
- `database.py`: SQLite e criação das tabelas
- `app.py`: inicialização Flask

## Executar

Na raiz do projeto:

```bash
python -m venv Backend/venv
Backend\venv\Scripts\activate
pip install -r Backend/requirements.txt
python -m Backend.app

cd transporta-pf
python -m http.server 5000
```

API de teste:

`http://127.0.0.1:5000/api/health`

Endpoints:

- `/api/alunos`
- `/api/motoristas`
- `/api/veiculos`
- `/api/viagens`

Todos possuem GET, POST e, quando aplicável, PUT/DELETE por ID.

Para subir no github atráves do git:

- `git init`
- `git add . (ou o que você quer adicionar)`
- `git commit -m " " ou git commit --allow-empty-message -m ""`
- `git Branch -M origin main`
-  `git push`
<<<<<<< HEAD

## Autenticação e permissões da API (módulo de viagens/embarque)

A API confirma o token do Supabase (`Authorization: Bearer ...`) consultando o próprio Supabase e descobre o
papel pelo **banco** (não pelo `user_metadata`, que o usuário consegue editar):

| Papel | Como é definido |
|---|---|
| `admin` | e-mail listado na variável de ambiente `TRANSPORTAPF_ADMINS` (separados por vírgula) |
| `monitora` | cadastro em `monitoras` com o e-mail do login (vínculo automático no 1º acesso, só com e-mail confirmado) |
| `motorista` | cadastro em `motoristas` com o e-mail do login (definido pelo admin em "Cadastros de apoio") |

```bash
# exemplo (Windows PowerShell: $env:TRANSPORTAPF_ADMINS="admin@prefeitura.gov.br")
export TRANSPORTAPF_ADMINS="admin@prefeitura.gov.br"
python -m Backend.app
```

Sem `TRANSPORTAPF_ADMINS`, ninguém acessa as telas administrativas de viagens. Outras variáveis opcionais:
`TRANSPORTAPF_SUPABASE_URL` e `TRANSPORTAPF_SUPABASE_KEY` (padrão: as mesmas de `supabase/supabase.js`).
O servidor precisa de acesso à internet para validar o token no Supabase.

Rotas protegidas: `/api/viagens`, `/api/escolas`, `/api/monitoras`, `/api/acesso` (admin) e `/api/servidor/*`
(admin, monitora ou motorista, sempre limitado às viagens do próprio usuário). Rotas de alunos, motoristas e
veículos continuam como estavam (módulos de outros integrantes) — ainda sem exigir login.
=======
>>>>>>> f87bf6d39891476c1ebdb9ddabb213f75f09b035
