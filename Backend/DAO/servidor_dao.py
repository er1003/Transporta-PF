"""Consultas da área do servidor (monitora/motorista): viagens, alunos, embarque e histórico."""
import sqlite3
from datetime import date, datetime

from ..database import get_connection
from .viagem_dao import ViagemDAO, chave_nome


class JaEmbarcou(Exception):
    def __init__(self, embarcado_em):
        super().__init__("Aluno já embarcou nesta viagem.")
        self.embarcado_em = embarcado_em


def hoje():
    return date.today().isoformat()


class ServidorDAO:
    # ---------------------------------------------------------------- viagens
    def viagens(self, usuario, periodo=None, de=None, ate=None, escola_id=None, turno=None):
        """Viagens que o usuário pode ver: as dele (monitora/motorista) ou todas (administrador)."""
        where, params = [], []
        if not usuario.admin:
            conds = []
            if usuario.monitora_id:
                conds.append("v.monitora_id = ?"); params.append(usuario.monitora_id)
            if usuario.motorista_id:
                conds.append("v.motorista_id = ?"); params.append(usuario.motorista_id)
            if not conds:
                return []
            where.append("(" + " OR ".join(conds) + ")")
        h = hoje()
        ordem = "ASC"
        if periodo == "hoje":
            where.append("v.data_viagem = ?"); params.append(h)
        elif periodo == "proximas":
            where.append("v.data_viagem > ? AND v.status <> 'cancelada'"); params.append(h)
        elif periodo == "historico":
            where.append("v.status <> 'cancelada' AND (v.data_viagem < ? OR v.status IN ('concluida','em_andamento'))")
            params.append(h)
            ordem = "DESC"
        if de:
            where.append("v.data_viagem >= ?"); params.append(de)
        if ate:
            where.append("v.data_viagem <= ?"); params.append(ate)
        if escola_id:
            where.append("v.escola_id = ?"); params.append(escola_id)
        if turno:
            where.append("v.turno = ?"); params.append(turno)
        sql = ViagemDAO._SELECT_DETALHADO + (" WHERE " + " AND ".join(where) if where else "")
        sql += f" ORDER BY v.data_viagem {ordem}, v.horario {ordem}, v.id {ordem}"
        with get_connection() as c:
            rows = c.execute(sql, params).fetchall()
        return [ViagemDAO._dict_detalhado(r) for r in rows]

    @staticmethod
    def pode_ver(usuario, viagem):
        return bool(usuario.admin
                    or (usuario.monitora_id and viagem["monitora_id"] == usuario.monitora_id)
                    or (usuario.motorista_id and viagem["motorista_id"] == usuario.motorista_id))

    # ----------------------------------------------------------------- alunos
    def alunos(self, viagem_id, busca=None, situacao=None, escola_id=None, turno=None):
        """Lista da viagem. Só dados necessários ao embarque (sem telefone, endereço ou e-mail)."""
        with get_connection() as c:
            v = c.execute("SELECT turno FROM viagens WHERE id=?", (viagem_id,)).fetchone()
            rows = c.execute(
                """SELECT a.id, a.nome, a.escola_id, e.nome AS escola_nome, a.turno,
                          em.embarcado_em, mo.nome AS registrado_por
                   FROM viagem_alunos va
                   JOIN alunos a ON a.id = va.aluno_id
                   LEFT JOIN escolas e ON e.id = a.escola_id
                   LEFT JOIN embarques em ON em.viagem_id = va.viagem_id AND em.aluno_id = va.aluno_id
                   LEFT JOIN monitoras mo ON mo.id = em.monitora_id
                   WHERE va.viagem_id = ?""", (viagem_id,)).fetchall()
        todos = []
        for r in rows:
            d = dict(r)
            d["turno"] = d["turno"] or (v["turno"] if v else None)
            d["embarcado"] = d["embarcado_em"] is not None
            todos.append(d)
        total, emb = len(todos), sum(1 for a in todos if a["embarcado"])
        termo = chave_nome(busca or "").strip()
        lista = []
        for a in todos:
            if termo and termo not in chave_nome(a["nome"]):
                continue
            if situacao == "embarcados" and not a["embarcado"]:
                continue
            if situacao == "pendentes" and a["embarcado"]:
                continue
            if escola_id and str(a["escola_id"]) != str(escola_id):
                continue
            if turno and a["turno"] != turno:
                continue
            lista.append(a)
        lista.sort(key=lambda a: chave_nome(a["nome"]))
        return {"total": total, "embarcados": emb, "pendentes": total - emb, "alunos": lista}

    def aluno_da_viagem(self, viagem_id, aluno_id):
        with get_connection() as c:
            r = c.execute(
                """SELECT a.id, a.nome, em.embarcado_em, mo.nome AS registrado_por
                   FROM viagem_alunos va JOIN alunos a ON a.id = va.aluno_id
                   LEFT JOIN embarques em ON em.viagem_id=va.viagem_id AND em.aluno_id=va.aluno_id
                   LEFT JOIN monitoras mo ON mo.id = em.monitora_id
                   WHERE va.viagem_id=? AND va.aluno_id=?""", (viagem_id, aluno_id)).fetchone()
        return dict(r) if r else None

    # --------------------------------------------------------------- embarque
    def registrar_embarque(self, viagem_id, aluno_id, monitora_id):
        """Grava o embarque no banco. A hora é a do servidor (não confia no relógio do celular).
        Levanta JaEmbarcou se o aluno já embarcou nesta viagem (UNIQUE no banco)."""
        agora = datetime.now().isoformat(timespec="seconds")
        with get_connection() as c:
            try:
                c.execute(
                    "INSERT INTO embarques (viagem_id, aluno_id, monitora_id, embarcado_em) VALUES (?,?,?,?)",
                    (viagem_id, aluno_id, monitora_id, agora))
            except sqlite3.IntegrityError:
                ja = c.execute("SELECT embarcado_em FROM embarques WHERE viagem_id=? AND aluno_id=?",
                               (viagem_id, aluno_id)).fetchone()
                raise JaEmbarcou(ja["embarcado_em"] if ja else None)
            c.execute("UPDATE viagens SET status='em_andamento' WHERE id=? AND status='planejada'", (viagem_id,))
        # Relê do banco já gravado: o que a tela mostra é o que foi persistido.
        return self.aluno_da_viagem(viagem_id, aluno_id)

    def concluir(self, viagem_id):
        with get_connection() as c:
            cur = c.execute("UPDATE viagens SET status='concluida' WHERE id=? AND status IN ('planejada','em_andamento')",
                            (viagem_id,))
            return cur.rowcount > 0

    # -------------------------------------------------------------- histórico
    @staticmethod
    def resumo(viagens):
        validas = [v for v in viagens if v["status"] != "cancelada"]
        emb = sum(v["total_embarcados"] for v in validas)
        tot = sum(v["total_alunos"] for v in validas)
        return {"viagens": len(validas),
                "concluidas": sum(1 for v in validas if v["status"] == "concluida"),
                "alunos": tot, "embarcados": emb, "pendentes": tot - emb}
