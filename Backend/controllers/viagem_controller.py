from flask import Blueprint, jsonify, request
from ..DAO.viagem_dao import ViagemDAO
from ..models.viagem import Viagem

bp=Blueprint("viagens",__name__,url_prefix="/api/viagens")
dao=ViagemDAO()

@bp.get("")
def listar(): return jsonify([x.to_dict() for x in dao.listar()])

@bp.get("/<int:id_>")
def buscar(id_):
    x=dao.buscar_por_id(id_)
    return jsonify(x.to_dict()) if x else (jsonify({"message":"Viagem não encontrada."}),404)

@bp.post("")
def criar():
    d=request.get_json(silent=True) or {}
    data=str(d.get("data_viagem","")).strip()
    if not data: return jsonify({"message":"Data da viagem é obrigatória."}),400
    try:
        x=dao.criar(Viagem(data_viagem=data,origem=d.get("origem"),
            destino=d.get("destino"),motorista_id=d.get("motorista_id"),
            veiculo_id=d.get("veiculo_id"),status=d.get("status","planejada")))
        return jsonify(x.to_dict()),201
    except Exception as e: return jsonify({"message":str(e)}),400

@bp.put("/<int:id_>")
def atualizar(id_):
    x=dao.buscar_por_id(id_)
    if not x: return jsonify({"message":"Viagem não encontrada."}),404
    d=request.get_json(silent=True) or {}
    for f in ["data_viagem","origem","destino","motorista_id","veiculo_id","status"]:
        if f in d: setattr(x,f,d[f])
    try: return jsonify(dao.atualizar(x).to_dict())
    except Exception as e: return jsonify({"message":str(e)}),400

@bp.delete("/<int:id_>")
def excluir(id_):
    if not dao.excluir(id_): return jsonify({"message":"Viagem não encontrada."}),404
    return jsonify({"message":"Viagem excluída com sucesso."})
