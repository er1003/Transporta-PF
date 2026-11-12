from ..database import get_connection
from ..models.monitora import Monitora

class MonitoraDAO:
    def listar(self):
        with get_connection() as c:
            rows = c.execute("SELECT * FROM monitoras ORDER BY nome COLLATE NOCASE").fetchall()
        return [Monitora.from_row(r) for r in rows]

    def buscar_por_id(self, id_):
        with get_connection() as c:
            r = c.execute("SELECT * FROM monitoras WHERE id=?", (id_,)).fetchone()
        return Monitora.from_row(r) if r else None

    def buscar_por_auth_user(self, auth_user_id):
        with get_connection() as c:
            r = c.execute("SELECT * FROM monitoras WHERE auth_user_id=?", (auth_user_id,)).fetchone()
        return Monitora.from_row(r) if r else None

    def criar(self, m):
        with get_connection() as c:
            cur = c.execute(
                "INSERT INTO monitoras (nome,telefone,email,auth_user_id,ativo) VALUES (?,?,?,?,?)",
                (m.nome, m.telefone, m.email, m.auth_user_id, int(m.ativo)))
            m.id = cur.lastrowid
        return m

    def atualizar(self, m):
        with get_connection() as c:
            c.execute(
                "UPDATE monitoras SET nome=?,telefone=?,email=?,auth_user_id=?,ativo=? WHERE id=?",
                (m.nome, m.telefone, m.email, m.auth_user_id, int(m.ativo), m.id))
        return self.buscar_por_id(m.id)
