from ..database import get_connection
from ..models.escola import Escola

class EscolaDAO:
    def listar(self):
        with get_connection() as c:
            rows = c.execute("SELECT * FROM escolas ORDER BY nome COLLATE NOCASE").fetchall()
        return [Escola.from_row(r) for r in rows]

    def buscar_por_id(self, id_):
        with get_connection() as c:
            r = c.execute("SELECT * FROM escolas WHERE id=?", (id_,)).fetchone()
        return Escola.from_row(r) if r else None

    def criar(self, escola):
        with get_connection() as c:
            cur = c.execute("INSERT INTO escolas (nome,ativo) VALUES (?,?)",
                            (escola.nome, int(escola.ativo)))
            escola.id = cur.lastrowid
        return escola

    def atualizar(self, escola):
        with get_connection() as c:
            c.execute("UPDATE escolas SET nome=?,ativo=? WHERE id=?",
                      (escola.nome, int(escola.ativo), escola.id))
        return self.buscar_por_id(escola.id)

    def definir_escola_turno_aluno(self, aluno_id, escola_id, turno):
        """Grava escola/turno do aluno (colunas novas; não altera o CRUD de alunos)."""
        with get_connection() as c:
            cur = c.execute("UPDATE alunos SET escola_id=?, turno=? WHERE id=?",
                            (escola_id, turno, aluno_id))
            return cur.rowcount > 0
