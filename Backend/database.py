import sqlite3
from contextlib import contextmanager
from .config import DATABASE_PATH

@contextmanager
def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()

def init_db():
    with get_connection() as connection:
        connection.executescript("""
        CREATE TABLE IF NOT EXISTS alunos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT,
            telefone TEXT,
            endereco TEXT,
            responsavel TEXT,
            ativo INTEGER NOT NULL DEFAULT 1,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS motoristas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            cnh TEXT NOT NULL UNIQUE,
            telefone TEXT,
            ativo INTEGER NOT NULL DEFAULT 1,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS veiculos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            placa TEXT NOT NULL UNIQUE,
            modelo TEXT,
            capacidade INTEGER NOT NULL DEFAULT 0,
            ativo INTEGER NOT NULL DEFAULT 1,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS viagens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data_viagem TEXT NOT NULL,
            origem TEXT,
            destino TEXT,
            motorista_id INTEGER,
            veiculo_id INTEGER,
            status TEXT NOT NULL DEFAULT 'planejada',
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (motorista_id) REFERENCES motoristas(id),
            FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)
        );
        """)
        _migrar_modulo_viagens(connection)


def _colunas(connection, tabela):
    return {r["name"] for r in connection.execute(f"PRAGMA table_info({tabela})")}


def _adicionar_coluna(connection, tabela, coluna, definicao):
    # SQLite não tem "ADD COLUMN IF NOT EXISTS": confere antes de alterar.
    if coluna not in _colunas(connection, tabela):
        connection.execute(f"ALTER TABLE {tabela} ADD COLUMN {coluna} {definicao}")


def _migrar_modulo_viagens(connection):
    """Estruturas do módulo de viagens e embarque. Idempotente: pode rodar a cada start."""
    connection.executescript("""
    CREATE TABLE IF NOT EXISTS escolas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE,
        ativo INTEGER NOT NULL DEFAULT 1,
        criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS monitoras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        telefone TEXT,
        email TEXT UNIQUE,
        auth_user_id TEXT UNIQUE,   -- id do usuário no Supabase Auth (liga login -> monitora)
        ativo INTEGER NOT NULL DEFAULT 1,
        criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Novas colunas em tabelas existentes (sem recriar nem apagar dados)
    _adicionar_coluna(connection, "alunos", "escola_id", "INTEGER REFERENCES escolas(id)")
    _adicionar_coluna(connection, "alunos", "turno", "TEXT")
    _adicionar_coluna(connection, "viagens", "escola_id", "INTEGER REFERENCES escolas(id)")
    _adicionar_coluna(connection, "viagens", "turno", "TEXT")
    _adicionar_coluna(connection, "viagens", "horario", "TEXT")
    _adicionar_coluna(connection, "viagens", "monitora_id", "INTEGER REFERENCES monitoras(id)")
    # Vínculo do motorista com o login (mesmo modelo de monitoras): sem isso não há como saber
    # quais viagens pertencem ao motorista que entrou no sistema.
    _adicionar_coluna(connection, "motoristas", "email", "TEXT")
    _adicionar_coluna(connection, "motoristas", "auth_user_id", "TEXT")
    connection.execute("CREATE UNIQUE INDEX IF NOT EXISTS ux_motoristas_auth ON motoristas(auth_user_id) WHERE auth_user_id IS NOT NULL")

    connection.executescript("""
    CREATE TABLE IF NOT EXISTS viagem_alunos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        viagem_id INTEGER NOT NULL,
        aluno_id INTEGER NOT NULL,
        criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (viagem_id, aluno_id),
        FOREIGN KEY (viagem_id) REFERENCES viagens(id) ON DELETE CASCADE,
        FOREIGN KEY (aluno_id) REFERENCES alunos(id)
    );

    -- UNIQUE(viagem_id, aluno_id) impede registrar o mesmo aluno duas vezes na mesma viagem.
    CREATE TABLE IF NOT EXISTS embarques (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        viagem_id INTEGER NOT NULL,
        aluno_id INTEGER NOT NULL,
        monitora_id INTEGER,
        embarcado_em TEXT NOT NULL,
        UNIQUE (viagem_id, aluno_id),
        FOREIGN KEY (viagem_id) REFERENCES viagens(id),
        FOREIGN KEY (aluno_id) REFERENCES alunos(id),
        FOREIGN KEY (monitora_id) REFERENCES monitoras(id)
    );

    CREATE INDEX IF NOT EXISTS idx_viagens_data ON viagens(data_viagem);
    CREATE INDEX IF NOT EXISTS idx_viagem_alunos_viagem ON viagem_alunos(viagem_id);
    CREATE INDEX IF NOT EXISTS idx_embarques_viagem ON embarques(viagem_id);
    """)
