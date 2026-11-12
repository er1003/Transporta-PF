from flask import Blueprint, jsonify, request
from ..DAO.monitora_dao import MonitoraDAO
from ..models.monitora import Monitora

bp = Blueprint("monitoras", __name__, url_prefix="/api/monitoras")
dao = MonitoraDAO()

@bp.get("")
def listar():
    return jsonify([x.to_dict() for x in dao.listar()])

@bp.get("/<int:id_>")
def buscar(id_):
    x = dao.buscar_por_id(id_)
    return jsonify(x.to_dict()) if x else (jsonify({"message": "Monitora não encontrada."}), 404)

@bp.get("/por-usuario/<auth_user_id>")
def por_usuario(auth_user_id):
    """Resolve a monitora a partir do id do usuário logado no Supabase (user.id)."""
    x = dao.buscar_por_auth_user(auth_user_id)
    return jsonify(x.to_dict()) if x else (jsonify({"message": "Nenhuma monitora vinculada a este usuário."}), 404)

@bp.post("")
def criar():
    d = request.get_json(silent=True) or {}
    nome = str(d.get("nome", "")).strip()
    if not nome:
        return jsonify({"message": "Nome é obrigatório."}), 400
    try:
        x = dao.criar(Monitora(
            nome=nome, telefone=d.get("telefone"), email=d.get("email") or None,
            auth_user_id=d.get("auth_user_id") or None, ativo=bool(d.get("ativo", True))))
        return jsonify(x.to_dict()), 201
    except Exception as e:
        return jsonify({"message": "Não foi possível salvar (e-mail ou usuário já vinculado?): " + str(e)}), 400

@bp.put("/<int:id_>")
def atualizar(id_):
    x = dao.buscar_por_id(id_)
    if not x:
        return jsonify({"message": "Monitora não encontrada."}), 404
    d = request.get_json(silent=True) or {}
    for f in ["nome", "telefone", "email", "auth_user_id", "ativo"]:
        if f in d:
            setattr(x, f, d[f] if d[f] != "" else None)
    x.ativo = bool(x.ativo)
    if not str(x.nome or "").strip():
        return jsonify({"message": "Nome é obrigatório."}), 400
    try:
        return jsonify(dao.atualizar(x).to_dict())
    except Exception as e:
        return jsonify({"message": str(e)}), 400
