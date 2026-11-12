from datetime import datetime
from flask import Blueprint, jsonify, request
from .. import auth
from ..DAO.servidor_dao import ServidorDAO, JaEmbarcou, hoje
from ..DAO.viagem_dao import ViagemDAO

bp = Blueprint("servidor", __name__, url_prefix="/api/servidor")
bp.before_request(lambda: auth.checar("admin", "monitora", "motorista"))
dao = ServidorDAO()
viagem_dao = ViagemDAO()


def _erro(msg, codigo=400):
    return jsonify({"message": msg}), codigo


def _viagem(id_):
    """Viagem visível ao usuário, ou (None, resposta_de_erro). 404 igual para 'não existe' e 'não é sua'."""
    v = viagem_dao.buscar_detalhado(id_)
    if not v or not dao.pode_ver(auth.usuario_atual(), v):
        return None, _erro("Viagem não encontrada.", 404)
    return v, None


@bp.get("/viagens")
def viagens():
    periodo = request.args.get("periodo", "hoje")
    if periodo not in ("hoje", "proximas"):
        return _erro("Período inválido.")
    return jsonify(dao.viagens(auth.usuario_atual(), periodo=periodo))


@bp.get("/viagens/<int:id_>")
def viagem(id_):
    v, erro = _viagem(id_)
    return erro or jsonify(v)


@bp.get("/viagens/<int:id_>/alunos")
def alunos(id_):
    v, erro = _viagem(id_)
    if erro:
        return erro
    u = auth.usuario_atual()
    if not (u.admin or u.monitora_id == v["monitora_id"]):
        return _erro("A lista de alunos é restrita à monitora da viagem.", 403)
    a = request.args
    return jsonify(dao.alunos(id_, busca=a.get("busca"), situacao=a.get("situacao"),
                              escola_id=a.get("escola_id"), turno=a.get("turno")))


def _monitora_da_viagem(id_):
    v, erro = _viagem(id_)
    if erro:
        return None, erro
    u = auth.usuario_atual()
    if not (u.monitora_id and u.monitora_id == v["monitora_id"]):
        return None, _erro("Somente a monitora responsável pode fazer esta ação.", 403)
    return v, None


@bp.post("/viagens/<int:id_>/embarques")
def embarcar(id_):
    v, erro = _monitora_da_viagem(id_)
    if erro:
        return erro
    if v["status"] in ("cancelada", "concluida"):
        return _erro("Esta viagem está " + ("cancelada." if v["status"] == "cancelada" else "concluída."), 409)
    if v["data_viagem"] != hoje():
        d = "/".join(reversed(v["data_viagem"].split("-")))
        return _erro(f"Só é possível registrar embarques no dia da viagem ({d}).", 409)
    aluno_id = (request.get_json(silent=True) or {}).get("aluno_id")
    if not isinstance(aluno_id, int):
        return _erro("Aluno não informado.")
    if not dao.aluno_da_viagem(id_, aluno_id):
        return _erro("Este aluno não está vinculado a esta viagem.", 404)
    try:
        reg = dao.registrar_embarque(id_, aluno_id, auth.usuario_atual().monitora_id)
    except JaEmbarcou as e:
        return jsonify({"message": "Este aluno já embarcou nesta viagem.", "embarcado_em": e.embarcado_em}), 409
    return jsonify({"message": f"Embarque de {reg['nome']} confirmado.", "aluno": reg}), 201


@bp.post("/viagens/<int:id_>/concluir")
def concluir(id_):
    v, erro = _monitora_da_viagem(id_)
    if erro:
        return erro
    if v["status"] in ("cancelada", "concluida"):
        return _erro("Esta viagem já está " + ("cancelada." if v["status"] == "cancelada" else "concluída."), 409)
    dao.concluir(id_)
    return jsonify(viagem_dao.buscar_detalhado(id_))


@bp.get("/historico")
def historico():
    a = request.args
    for campo in ("de", "ate"):
        if a.get(campo):
            try:
                datetime.strptime(a[campo], "%Y-%m-%d")
            except ValueError:
                return _erro("Data inválida (use AAAA-MM-DD).")
    lista = dao.viagens(auth.usuario_atual(), periodo="historico", de=a.get("de"), ate=a.get("ate"),
                        escola_id=a.get("escola_id"), turno=a.get("turno"))
    escolas = {v["escola_id"]: v["escola_nome"] for v in lista if v["escola_id"]}
    return jsonify({"resumo": dao.resumo(lista), "viagens": lista,
                    "escolas": [{"id": i, "nome": n} for i, n in sorted(escolas.items(), key=lambda x: x[1])]})
