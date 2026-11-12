import re
from flask import Blueprint, jsonify, request
from .. import auth
from ..DAO.acesso_dao import AcessoDAO

bp = Blueprint("acesso", __name__, url_prefix="/api/acesso")
bp.before_request(auth.exigir_admin)
dao = AcessoDAO()
RE_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@bp.put("/motorista/<int:id_>")
def email_motorista(id_):
    """Define o e-mail de login do motorista; no primeiro acesso ele é vinculado automaticamente."""
    d = request.get_json(silent=True) or {}
    email = str(d.get("email", "")).strip().lower()
    if not RE_EMAIL.match(email):
        return jsonify({"message": "Informe um e-mail válido."}), 400
    if not dao.definir_email_motorista(id_, email):
        return jsonify({"message": "Motorista não encontrado."}), 404
    return jsonify({"message": "E-mail de acesso do motorista salvo."})
