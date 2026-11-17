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

# em outro terminal, na pasta do site (porta diferente da API):
python -m http.server 8000
# abra http://localhost:8000/html/index.html
```

API de teste:

`http://127.0.0.1:5000/api/health`

Endpoints:

- `/api/alunos`
- `/api/motoristas`
- `/api/veiculos`
- `/api/viagens`

Todos possuem GET, POST e, quando aplicável, PUT/DELETE por ID.

para subir no github atráves do git 

git init
git add . (ou o que você quer adicionar)
git commit -m " " ou git commit --allow-empty-message -m ""
git branch -M main
git remote add origin <url-do-repositorio>
git push -u origin main 
