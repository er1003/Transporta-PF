from ..database import get_connection
from ..models.veiculo import Veiculo

class VeiculoDAO:
    def listar(self):
        with get_connection() as c:
            rows = c.execute("SELECT * FROM veiculos ORDER BY id DESC").fetchall()
        return [Veiculo.from_row(r) for r in rows]

    def buscar_por_id(self, id_):
        with get_connection() as c:
            r = c.execute("SELECT * FROM veiculos WHERE id=?", (id_,)).fetchone()
        return Veiculo.from_row(r) if r else None

    def criar(self, item):
        with get_connection() as c:
            cur = c.execute(
                "INSERT INTO veiculos (placa,modelo,capacidade,ativo) VALUES (?,?,?,?)",
                (item.placa, item.modelo, item.capacidade, int(item.ativo))
            )
            item.id = cur.lastrowid
        return item

    def atualizar(self, item):
        with get_connection() as c:
            c.execute(
                "UPDATE veiculos SET placa=?,modelo=?,capacidade=?,ativo=? WHERE id=?",
                (item.placa, item.modelo, item.capacidade, int(item.ativo), item.id)
            )
        return self.buscar_por_id(item.id)

    def excluir(self, id_):
        with get_connection() as c:
            cur = c.execute("DELETE FROM veiculos WHERE id=?", (id_,))
            return cur.rowcount > 0
