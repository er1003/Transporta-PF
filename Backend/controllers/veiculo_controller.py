from flask import Blueprint, jsonify, request
from ..DAO.veiculo_dao import VeiculoDAO
from ..models.veiculo import Veiculo

bp=Blueprint("veiculos",__name__,url_prefix="/api/veiculos")
dao=VeiculoDAO()

@bp.get("")
def listar(): return jsonify([x.to_dict() for x in dao.listar()])

@bp.get("/<int:id_>")
def buscar(id_):
    x=dao.buscar_por_id(id_)
    return jsonify(x.to_dict()) if x else (jsonify({"message":"Veículo não encontrado."}),404)

@bp.post("")
def criar():
    d=request.get_json(silent=True) or {}
    placa=str(d.get("placa","")).strip()
    if not placa: return jsonify({"message":"Placa é obrigatória."}),400
    try: capacidade=int(d.get("capacidade",0))
    except (TypeError,ValueError): return jsonify({"message":"Capacidade inválida."}),400
    try:
        x=dao.criar(Veiculo(placa=placa,modelo=d.get("modelo"),
            capacidade=capacidade,ativo=bool(d.get("ativo",True))))
        return jsonify(x.to_dict()),201
    except Exception as e: return jsonify({"message":str(e)}),400

@bp.put("/<int:id_>")
def atualizar(id_):
    x=dao.buscar_por_id(id_)
    if not x: return jsonify({"message":"Veículo não encontrado."}),404
    d=request.get_json(silent=True) or {}
    for f in ["placa","modelo","capacidade","ativo"]:
        if f in d: setattr(x,f,d[f])
    try:
        x.capacidade=int(x.capacidade)
        return jsonify(dao.atualizar(x).to_dict())
    except Exception as e: return jsonify({"message":str(e)}),400

@bp.delete("/<int:id_>")
def excluir(id_):
    try: removido=dao.excluir(id_)
    except Exception: return jsonify({"message":"Registro em uso por viagens; não pode ser excluído."}),409
    if not removido: return jsonify({"message":"Veículo não encontrado."}),404
    return jsonify({"message":"Veículo excluído com sucesso."})
