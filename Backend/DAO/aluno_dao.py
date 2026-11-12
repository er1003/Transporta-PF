from ..database import get_connection
from ..models.aluno import Aluno

class AlunoDAO:
    def listar(self):
        with get_connection() as c:
            rows = c.execute("SELECT * FROM alunos ORDER BY id DESC").fetchall()
        return [Aluno.from_row(r) for r in rows]

    def buscar_por_id(self, id_):
        with get_connection() as c:
            r = c.execute("SELECT * FROM alunos WHERE id=?", (id_,)).fetchone()
        return Aluno.from_row(r) if r else None

    def criar(self, aluno):
        with get_connection() as c:
            cur = c.execute(
                """INSERT INTO alunos
                (nome,email,telefone,endereco,responsavel,ativo)
                VALUES (?,?,?,?,?,?)""",
                (aluno.nome, aluno.email, aluno.telefone,
                 aluno.endereco, aluno.responsavel, int(aluno.ativo))
            )
            aluno.id = cur.lastrowid
        return aluno

    def atualizar(self, aluno):
        with get_connection() as c:
            c.execute(
                """UPDATE alunos SET nome=?,email=?,telefone=?,
                endereco=?,responsavel=?,ativo=? WHERE id=?""",
                (aluno.nome, aluno.email, aluno.telefone,
                 aluno.endereco, aluno.responsavel, int(aluno.ativo), aluno.id)
            )
        return self.buscar_por_id(aluno.id)

    def excluir(self, id_):
        with get_connection() as c:
            cur = c.execute("DELETE FROM alunos WHERE id=?", (id_,))
            return cur.rowcount > 0
