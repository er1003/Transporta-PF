from ..database import get_connection
from ..models.viagem import Viagem

class ViagemDAO:
    def listar(self):
        with get_connection() as c:
            rows = c.execute("SELECT * FROM viagens ORDER BY id DESC").fetchall()
        return [Viagem.from_row(r) for r in rows]

    def buscar_por_id(self, id_):
        with get_connection() as c:
            r = c.execute("SELECT * FROM viagens WHERE id=?", (id_,)).fetchone()
        return Viagem.from_row(r) if r else None

    def criar(self, item):
        with get_connection() as c:
            cur = c.execute(
                """INSERT INTO viagens
                (data_viagem,origem,destino,motorista_id,veiculo_id,status)
                VALUES (?,?,?,?,?,?)""",
                (item.data_viagem, item.origem, item.destino,
                 item.motorista_id, item.veiculo_id, item.status)
            )
            item.id = cur.lastrowid
        return item

    def atualizar(self, item):
        with get_connection() as c:
            c.execute(
                """UPDATE viagens SET data_viagem=?,origem=?,destino=?,
                motorista_id=?,veiculo_id=?,status=? WHERE id=?""",
                (item.data_viagem, item.origem, item.destino,
                 item.motorista_id, item.veiculo_id, item.status, item.id)
            )
        return self.buscar_por_id(item.id)

    def excluir(self, id_):
        with get_connection() as c:
            cur = c.execute("DELETE FROM viagens WHERE id=?", (id_,))
            return cur.rowcount > 0
