from ..database import get_connection
from ..models.motorista import Motorista

class MotoristaDAO:
    def listar(self):
        with get_connection() as c:
            rows = c.execute("SELECT * FROM motoristas ORDER BY id DESC").fetchall()
        return [Motorista.from_row(r) for r in rows]

    def buscar_por_id(self, id_):
        with get_connection() as c:
            r = c.execute("SELECT * FROM motoristas WHERE id=?", (id_,)).fetchone()
        return Motorista.from_row(r) if r else None

    def criar(self, item):
        with get_connection() as c:
            cur = c.execute(
                "INSERT INTO motoristas (nome,cnh,telefone,ativo) VALUES (?,?,?,?)",
                (item.nome, item.cnh, item.telefone, int(item.ativo))
            )
            item.id = cur.lastrowid
        return item

    def atualizar(self, item):
        with get_connection() as c:
            c.execute(
                "UPDATE motoristas SET nome=?,cnh=?,telefone=?,ativo=? WHERE id=?",
                (item.nome, item.cnh, item.telefone, int(item.ativo), item.id)
            )
        return self.buscar_por_id(item.id)

    def excluir(self, id_):
        with get_connection() as c:
            cur = c.execute("DELETE FROM motoristas WHERE id=?", (id_,))
            return cur.rowcount > 0
