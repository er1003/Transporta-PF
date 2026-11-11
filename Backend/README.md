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
