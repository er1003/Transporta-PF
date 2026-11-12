from flask import Blueprint, jsonify, request
from .. import auth
from ..DAO.escola_dao import EscolaDAO
from ..models.escola import Escola

bp = Blueprint("escolas", __name__, url_prefix="/api/escolas")
bp.before_request(auth.exigir_admin)  # somente administrador
dao = EscolaDAO()

TURNOS = ("manha", "tarde", "noite")

@bp.get("")
def listar():
    return jsonify([x.to_dict() for x in dao.listar()])

@bp.get("/<int:id_>")
def buscar(id_):
    x = dao.buscar_por_id(id_)
    return jsonify(x.to_dict()) if x else (jsonify({"message": "Escola não encontrada."}), 404)

@bp.post("")
def criar():
    d = request.get_json(silent=True) or {}
    nome = str(d.get("nome", "")).strip()
    if not nome:
        return jsonify({"message": "Nome da escola é obrigatório."}), 400
    try:
        x = dao.criar(Escola(nome=nome, ativo=bool(d.get("ativo", True))))
        return jsonify(x.to_dict()), 201
    except Exception as e:
        return jsonify({"message": "Não foi possível salvar a escola (nome já cadastrado?): " + str(e)}), 400

@bp.put("/<int:id_>")
def atualizar(id_):
    x = dao.buscar_por_id(id_)
    if not x:
        return jsonify({"message": "Escola não encontrada."}), 404
    d = request.get_json(silent=True) or {}
    if "nome" in d:
        x.nome = str(d["nome"]).strip()
    if "ativo" in d:
        x.ativo = bool(d["ativo"])
    if not x.nome:
        return jsonify({"message": "Nome da escola é obrigatório."}), 400
    try:
        return jsonify(dao.atualizar(x).to_dict())
    except Exception as e:
        return jsonify({"message": str(e)}), 400

@bp.put("/aluno/<int:aluno_id>")
def definir_escola_turno_aluno(aluno_id):
    """Define escola e turno de um aluno. Usado para montar a lista por escola/turno."""
    d = request.get_json(silent=True) or {}
    escola_id, turno = d.get("escola_id"), d.get("turno")
    if turno not in TURNOS:
        return jsonify({"message": "Turno inválido. Use: " + ", ".join(TURNOS) + "."}), 400
    if not escola_id or not dao.buscar_por_id(escola_id):
        return jsonify({"message": "Escola não encontrada."}), 400
    if not dao.definir_escola_turno_aluno(aluno_id, escola_id, turno):
        return jsonify({"message": "Aluno não encontrado."}), 404
    return jsonify({"message": "Escola e turno do aluno atualizados."})
