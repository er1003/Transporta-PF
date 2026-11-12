<<<<<<< HEAD
import unicodedata
from ..database import get_connection
from ..models.viagem import Viagem

def chave_nome(nome):
    """Chave de ordenação alfabética sem distinção de acento/caixa (SQLite NOCASE não trata acentos)."""
    sem_acento = unicodedata.normalize("NFD", nome or "")
    return "".join(c for c in sem_acento if unicodedata.category(c) != "Mn").casefold()


=======
from ..database import get_connection
from ..models.viagem import Viagem

>>>>>>> f87bf6d39891476c1ebdb9ddabb213f75f09b035
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
<<<<<<< HEAD
                (data_viagem,origem,destino,motorista_id,veiculo_id,status,
                 escola_id,turno,horario,monitora_id)
                VALUES (?,?,?,?,?,?,?,?,?,?)""",
                (item.data_viagem, item.origem, item.destino,
                 item.motorista_id, item.veiculo_id, item.status,
                 item.escola_id, item.turno, item.horario, item.monitora_id)
=======
                (data_viagem,origem,destino,motorista_id,veiculo_id,status)
                VALUES (?,?,?,?,?,?)""",
                (item.data_viagem, item.origem, item.destino,
                 item.motorista_id, item.veiculo_id, item.status)
>>>>>>> f87bf6d39891476c1ebdb9ddabb213f75f09b035
            )
            item.id = cur.lastrowid
        return item

    def atualizar(self, item):
        with get_connection() as c:
            c.execute(
                """UPDATE viagens SET data_viagem=?,origem=?,destino=?,
<<<<<<< HEAD
                motorista_id=?,veiculo_id=?,status=?,
                escola_id=?,turno=?,horario=?,monitora_id=? WHERE id=?""",
                (item.data_viagem, item.origem, item.destino,
                 item.motorista_id, item.veiculo_id, item.status,
                 item.escola_id, item.turno, item.horario, item.monitora_id, item.id)
=======
                motorista_id=?,veiculo_id=?,status=? WHERE id=?""",
                (item.data_viagem, item.origem, item.destino,
                 item.motorista_id, item.veiculo_id, item.status, item.id)
>>>>>>> f87bf6d39891476c1ebdb9ddabb213f75f09b035
            )
        return self.buscar_por_id(item.id)

    def excluir(self, id_):
        with get_connection() as c:
            cur = c.execute("DELETE FROM viagens WHERE id=?", (id_,))
            return cur.rowcount > 0
<<<<<<< HEAD


    # ------------------------------------------------------------------
    # Módulo de gerenciamento de viagens (métodos novos; os acima não mudam)
    # ------------------------------------------------------------------
    _SELECT_DETALHADO = """
        SELECT v.*,
               e.nome  AS escola_nome,
               m.nome  AS motorista_nome,
               ve.placa AS veiculo_placa, ve.modelo AS veiculo_modelo,
               ve.capacidade AS veiculo_capacidade,
               mo.nome AS monitora_nome,
               (SELECT COUNT(*) FROM viagem_alunos va WHERE va.viagem_id = v.id) AS total_alunos,
               (SELECT COUNT(*) FROM embarques em WHERE em.viagem_id = v.id)     AS total_embarcados
        FROM viagens v
        LEFT JOIN escolas e     ON e.id  = v.escola_id
        LEFT JOIN motoristas m  ON m.id  = v.motorista_id
        LEFT JOIN veiculos ve   ON ve.id = v.veiculo_id
        LEFT JOIN monitoras mo  ON mo.id = v.monitora_id
    """

    def listar_detalhado(self, data=None, escola_id=None, turno=None,
                         status=None, monitora_id=None):
        where, params = [], []
        for coluna, valor in (("v.data_viagem", data), ("v.escola_id", escola_id),
                              ("v.turno", turno), ("v.status", status),
                              ("v.monitora_id", monitora_id)):
            if valor not in (None, ""):
                where.append(f"{coluna} = ?")
                params.append(valor)
        sql = self._SELECT_DETALHADO
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY v.data_viagem DESC, v.horario DESC, v.id DESC"
        with get_connection() as c:
            rows = c.execute(sql, params).fetchall()
        return [self._dict_detalhado(r) for r in rows]

    def buscar_detalhado(self, id_):
        with get_connection() as c:
            r = c.execute(self._SELECT_DETALHADO + " WHERE v.id = ?", (id_,)).fetchone()
        return self._dict_detalhado(r) if r else None

    @staticmethod
    def _dict_detalhado(row):
        d = dict(row)
        d["total_pendentes"] = d["total_alunos"] - d["total_embarcados"]
        return d

    def conflitos(self, data_viagem, horario, veiculo_id, motorista_id,
                  monitora_id, ignorar_id=None):
        """Recursos já ocupados em outra viagem (não cancelada) na mesma data e horário."""
        with get_connection() as c:
            rows = c.execute(
                """SELECT id, veiculo_id, motorista_id, monitora_id FROM viagens
                   WHERE data_viagem=? AND horario=? AND status <> 'cancelada'
                   AND id <> ?""",
                (data_viagem, horario, ignorar_id or 0)
            ).fetchall()
        achados = []
        for r in rows:
            if veiculo_id and r["veiculo_id"] == veiculo_id:
                achados.append(("ônibus", r["id"]))
            if motorista_id and r["motorista_id"] == motorista_id:
                achados.append(("motorista", r["id"]))
            if monitora_id and r["monitora_id"] == monitora_id:
                achados.append(("monitora", r["id"]))
        return achados

    def contar_embarques(self, viagem_id):
        with get_connection() as c:
            return c.execute("SELECT COUNT(*) FROM embarques WHERE viagem_id=?",
                             (viagem_id,)).fetchone()[0]

    def listar_alunos(self, viagem_id):
        """Alunos vinculados à viagem, em ordem alfabética, com a situação do embarque."""
        with get_connection() as c:
            rows = c.execute(
                """SELECT a.id, a.nome, a.escola_id, e.nome AS escola_nome, a.turno,
                          em.embarcado_em, em.monitora_id
                   FROM viagem_alunos va
                   JOIN alunos a ON a.id = va.aluno_id
                   LEFT JOIN escolas e ON e.id = a.escola_id
                   LEFT JOIN embarques em
                          ON em.viagem_id = va.viagem_id AND em.aluno_id = va.aluno_id
                   WHERE va.viagem_id = ?
                   ORDER BY a.nome COLLATE NOCASE""",
                (viagem_id,)
            ).fetchall()
        alunos = []
        for r in rows:
            d = dict(r)
            d["embarcado"] = d["embarcado_em"] is not None
            alunos.append(d)
        alunos.sort(key=lambda a: chave_nome(a["nome"]))
        return alunos

    def definir_alunos(self, viagem_id, aluno_ids):
        """Substitui o conjunto de alunos da viagem de forma atômica.
        Levanta ValueError (mensagem para o usuário) se alguma regra for violada."""
        ids = list(dict.fromkeys(int(i) for i in aluno_ids))  # sem duplicados, mantém ordem
        with get_connection() as c:
            v = c.execute(
                """SELECT v.escola_id, v.turno, ve.capacidade FROM viagens v
                   LEFT JOIN veiculos ve ON ve.id = v.veiculo_id WHERE v.id=?""",
                (viagem_id,)
            ).fetchone()
            if not v:
                raise LookupError("Viagem não encontrada.")
            if v["capacidade"] and len(ids) > v["capacidade"]:
                raise ValueError(
                    f"O ônibus comporta {v['capacidade']} alunos; foram selecionados {len(ids)}.")
            for aid in ids:
                a = c.execute("SELECT nome, ativo, escola_id, turno FROM alunos WHERE id=?",
                              (aid,)).fetchone()
                if not a:
                    raise ValueError(f"Aluno {aid} não encontrado.")
                if not a["ativo"]:
                    raise ValueError(f"O aluno {a['nome']} está inativo.")
                if a["escola_id"] and v["escola_id"] and a["escola_id"] != v["escola_id"]:
                    raise ValueError(f"O aluno {a['nome']} pertence a outra escola.")
                if a["turno"] and v["turno"] and a["turno"] != v["turno"]:
                    raise ValueError(f"O aluno {a['nome']} estuda em outro turno.")
            atuais = {r["aluno_id"] for r in c.execute(
                "SELECT aluno_id FROM viagem_alunos WHERE viagem_id=?", (viagem_id,))}
            remover = atuais - set(ids)
            for aid in remover:
                if c.execute("SELECT 1 FROM embarques WHERE viagem_id=? AND aluno_id=?",
                             (viagem_id, aid)).fetchone():
                    nome = c.execute("SELECT nome FROM alunos WHERE id=?", (aid,)).fetchone()["nome"]
                    raise ValueError(
                        f"{nome} já embarcou nesta viagem e não pode ser removido.")
            for aid in remover:
                c.execute("DELETE FROM viagem_alunos WHERE viagem_id=? AND aluno_id=?",
                          (viagem_id, aid))
            for aid in ids:
                if aid not in atuais:
                    c.execute("INSERT INTO viagem_alunos (viagem_id, aluno_id) VALUES (?,?)",
                              (viagem_id, aid))
        return len(ids)

    def alunos_disponiveis(self, viagem_id):
        """Alunos ativos compatíveis com a escola/turno da viagem (ou ainda sem escola/turno
        definidos), marcando quais já estão vinculados."""
        with get_connection() as c:
            v = c.execute("SELECT escola_id, turno FROM viagens WHERE id=?", (viagem_id,)).fetchone()
            if not v:
                return None
            rows = c.execute(
                """SELECT a.id, a.nome, a.escola_id, e.nome AS escola_nome, a.turno,
                          CASE WHEN va.id IS NULL THEN 0 ELSE 1 END AS vinculado
                   FROM alunos a
                   LEFT JOIN escolas e ON e.id = a.escola_id
                   LEFT JOIN viagem_alunos va ON va.aluno_id = a.id AND va.viagem_id = ?
                   WHERE a.ativo = 1
                     AND (a.escola_id IS NULL OR a.escola_id = ?)
                     AND (a.turno IS NULL OR a.turno = ?)
                   ORDER BY a.nome COLLATE NOCASE""",
                (viagem_id, v["escola_id"], v["turno"])
            ).fetchall()
        lista = [dict(r, vinculado=bool(r["vinculado"])) for r in rows]
        lista.sort(key=lambda a: chave_nome(a["nome"]))
        return lista
=======
>>>>>>> f87bf6d39891476c1ebdb9ddabb213f75f09b035
