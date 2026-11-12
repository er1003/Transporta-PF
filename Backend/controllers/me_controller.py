from flask import Blueprint, jsonify
from .. import auth

bp = Blueprint("me", __name__, url_prefix="/api/me")


@bp.get("")
def me():
    """Quem sou eu e qual meu papel? (papel vem do banco, não do navegador)"""
    erro = auth.checar()
    if erro:
        return erro
    return jsonify(auth.usuario_atual().to_dict())
