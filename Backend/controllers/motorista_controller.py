from flask import Blueprint, jsonify, request
from ..DAO.motorista_dao import MotoristaDAO
from ..models.motorista import Motorista

bp = Blueprint("motoristas", __name__, url_prefix="/api/motoristas")
dao = MotoristaDAO()

@bp.get("")
def listar(): return jsonify([x.to_dict() for x in dao.listar()])

@bp.get("/<int:id_>")
def buscar(id_):
    x = dao.buscar_por_id(id_)
    return jsonify(x.to_dict()) if x else (jsonify({"message":"Motorista não encontrado."}),404)

@bp.post("")
def criar():
    d=request.get_json(silent=True) or {}
    if not str(d.get("nome","")).strip() or not str(d.get("cnh","")).strip():
        return jsonify({"message":"Nome e CNH são obrigatórios."}),400
    try:
        x=dao.criar(Motorista(
            nome=str(d["nome"]).strip(), cnh=str(d["cnh"]).strip(),
            telefone=d.get("telefone"), ativo=bool(d.get("ativo",True))
        ))
        return jsonify(x.to_dict()),201
    except Exception as e:
        return jsonify({"message":str(e)}),400

@bp.put("/<int:id_>")
def atualizar(id_):
    x=dao.buscar_por_id(id_)
    if not x: return jsonify({"message":"Motorista não encontrado."}),404
    d=request.get_json(silent=True) or {}
    for f in ["nome","cnh","telefone","ativo"]:
        if f in d: setattr(x,f,d[f])
    try: return jsonify(dao.atualizar(x).to_dict())
    except Exception as e: return jsonify({"message":str(e)}),400

@bp.delete("/<int:id_>")
def excluir(id_):
    try: removido=dao.excluir(id_)
    except Exception: return jsonify({"message":"Registro em uso por viagens; não pode ser excluído."}),409
    if not removido: return jsonify({"message":"Motorista não encontrado."}),404
    return jsonify({"message":"Motorista excluído com sucesso."})
