import re
from flask import Blueprint, jsonify, request
from ..DAO.viagem_dao import ViagemDAO
from ..DAO.veiculo_dao import VeiculoDAO
from ..DAO.motorista_dao import MotoristaDAO
from ..DAO.monitora_dao import MonitoraDAO
from ..DAO.escola_dao import EscolaDAO
from ..models.viagem import Viagem

bp = Blueprint("viagens", __name__, url_prefix="/api/viagens")
dao = ViagemDAO()
veiculo_dao = VeiculoDAO()
motorista_dao = MotoristaDAO()
monitora_dao = MonitoraDAO()
escola_dao = EscolaDAO()

TURNOS = ("manha", "tarde", "noite")
STATUS = ("planejada", "em_andamento", "concluida", "cancelada")
RE_DATA = re.compile(r"^\d{4}-\d{2}-\d{2}$")
RE_HORA = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def _erro(msg, codigo=400):
    return jsonify({"message": msg}), codigo


def _validar(v, ignorar_id=None):
    """Valida uma Viagem completa. Retorna mensagem de erro (str) ou None."""
    if not RE_DATA.match(str(v.data_viagem or "")):
        return "Data da viagem é obrigatória (AAAA-MM-DD)."
    if not RE_HORA.match(str(v.horario or "")):
        return "Horário da viagem é obrigatório (HH:MM)."
    if v.turno not in TURNOS:
        return "Turno é obrigatório (manhã, tarde ou noite)."
    if v.status not in STATUS:
        return "Status inválido."

    escola = escola_dao.buscar_por_id(v.escola_id) if v.escola_id else None
    if not escola or not escola.ativo:
        return "Selecione uma escola cadastrada e ativa."
    veiculo = veiculo_dao.buscar_por_id(v.veiculo_id) if v.veiculo_id else None
    if not veiculo or not veiculo.ativo:
        return "Selecione um ônibus cadastrado e ativo."
    motorista = motorista_dao.buscar_por_id(v.motorista_id) if v.motorista_id else None
    if not motorista or not motorista.ativo:
        return "Selecione um motorista cadastrado e ativo."
    monitora = monitora_dao.buscar_por_id(v.monitora_id) if v.monitora_id else None
    if not monitora or not monitora.ativo:
        return "Selecione uma monitora cadastrada e ativa."

    if v.status != "cancelada":
        achados = dao.conflitos(v.data_viagem, v.horario, v.veiculo_id,
                                v.motorista_id, v.monitora_id, ignorar_id)
        if achados:
            partes = [f"{recurso} (viagem #{vid})" for recurso, vid in achados]
            return ("Conflito de atribuição: já alocado em outra viagem na mesma data e horário — "
                    + ", ".join(partes) + ".")
    return None


@bp.get("")
def listar():
    # Resposta é um superset da anterior (mesmos campos + nomes e totais).
    # Filtros opcionais: ?data=AAAA-MM-DD&escola_id=&turno=&status=&monitora_id=
    a = request.args
    return jsonify(dao.listar_detalhado(
        data=a.get("data"), escola_id=a.get("escola_id"), turno=a.get("turno"),
        status=a.get("status"), monitora_id=a.get("monitora_id")))


@bp.get("/<int:id_>")
def buscar(id_):
    x = dao.buscar_detalhado(id_)
    return jsonify(x) if x else _erro("Viagem não encontrada.", 404)


@bp.post("")
def criar():
    d = request.get_json(silent=True) or {}
    v = Viagem(
        data_viagem=str(d.get("data_viagem", "")).strip(),
        origem=d.get("origem"), destino=d.get("destino"),
        motorista_id=d.get("motorista_id"), veiculo_id=d.get("veiculo_id"),
        status=d.get("status", "planejada"), escola_id=d.get("escola_id"),
        turno=d.get("turno"), horario=str(d.get("horario", "")).strip(),
        monitora_id=d.get("monitora_id"),
    )
    erro = _validar(v)
    if erro:
        return _erro(erro, 409 if erro.startswith("Conflito") else 400)
    try:
        x = dao.criar(v)
        return jsonify(dao.buscar_detalhado(x.id)), 201
    except Exception as e:
        return _erro(str(e))


@bp.put("/<int:id_>")
def atualizar(id_):
    x = dao.buscar_por_id(id_)
    if not x:
        return _erro("Viagem não encontrada.", 404)
    if x.status == "concluida":
        return _erro("Viagem concluída não pode ser editada.", 409)
    d = request.get_json(silent=True) or {}
    antes = (x.escola_id, x.turno)
    for f in ["data_viagem", "origem", "destino", "motorista_id", "veiculo_id",
              "status", "escola_id", "turno", "horario", "monitora_id"]:
        if f in d:
            setattr(x, f, d[f])
    if (x.escola_id, x.turno) != antes and dao.listar_alunos(id_):
        return _erro("Remova os alunos vinculados antes de trocar a escola ou o turno.", 409)
    erro = _validar(x, ignorar_id=id_)
    if erro:
        return _erro(erro, 409 if erro.startswith("Conflito") else 400)
    try:
        dao.atualizar(x)
        return jsonify(dao.buscar_detalhado(id_))
    except Exception as e:
        return _erro(str(e))


@bp.post("/<int:id_>/cancelar")
def cancelar(id_):
    x = dao.buscar_por_id(id_)
    if not x:
        return _erro("Viagem não encontrada.", 404)
    if x.status == "concluida":
        return _erro("Viagem concluída não pode ser cancelada.", 409)
    x.status = "cancelada"
    dao.atualizar(x)
    return jsonify(dao.buscar_detalhado(id_))


@bp.delete("/<int:id_>")
def excluir(id_):
    x = dao.buscar_por_id(id_)
    if not x:
        return _erro("Viagem não encontrada.", 404)
    if dao.contar_embarques(id_) > 0 or x.status in ("em_andamento", "concluida"):
        return _erro("Viagem com histórico de embarques não pode ser excluída. "
                     "Use \"Cancelar\" para preservar o histórico.", 409)
    if not dao.excluir(id_):
        return _erro("Viagem não encontrada.", 404)
    return jsonify({"message": "Viagem excluída com sucesso."})


# ---------------- alunos da viagem ----------------
@bp.get("/<int:id_>/alunos")
def listar_alunos(id_):
    if not dao.buscar_por_id(id_):
        return _erro("Viagem não encontrada.", 404)
    return jsonify(dao.listar_alunos(id_))


@bp.get("/<int:id_>/alunos-disponiveis")
def alunos_disponiveis(id_):
    r = dao.alunos_disponiveis(id_)
    return jsonify(r) if r is not None else _erro("Viagem não encontrada.", 404)


@bp.put("/<int:id_>/alunos")
def definir_alunos(id_):
    """Corpo: {"aluno_ids": [1,2,3]} — substitui os alunos vinculados à viagem."""
    x = dao.buscar_por_id(id_)
    if not x:
        return _erro("Viagem não encontrada.", 404)
    if x.status in ("concluida", "cancelada"):
        return _erro("Não é possível alterar os alunos de uma viagem " +
                     ("concluída." if x.status == "concluida" else "cancelada."), 409)
    d = request.get_json(silent=True) or {}
    ids = d.get("aluno_ids")
    if not isinstance(ids, list) or not all(isinstance(i, int) for i in ids):
        return _erro("Informe aluno_ids como uma lista de números.")
    try:
        total = dao.definir_alunos(id_, ids)
    except LookupError as e:
        return _erro(str(e), 404)
    except ValueError as e:
        return _erro(str(e), 409)
    return jsonify({"message": f"{total} aluno(s) vinculado(s) à viagem.",
                    "alunos": dao.listar_alunos(id_)})
