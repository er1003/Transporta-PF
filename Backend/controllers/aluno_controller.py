from flask import Blueprint, jsonify, request
from ..DAO.aluno_dao import AlunoDAO
from ..models.aluno import Aluno

bp = Blueprint("alunos", __name__, url_prefix="/api/alunos")
dao = AlunoDAO()

@bp.get("")
def listar():
    return jsonify([x.to_dict() for x in dao.listar()])

@bp.get("/<int:id_>")
def buscar(id_):
    x = dao.buscar_por_id(id_)
    return jsonify(x.to_dict()) if x else (jsonify({"message":"Aluno não encontrado."}),404)

@bp.post("")
def criar():
    d = request.get_json(silent=True) or {}
    nome = str(d.get("nome","")).strip()
    if not nome:
        return jsonify({"message":"Nome é obrigatório."}),400
    try:
        x = dao.criar(Aluno(
            nome=nome, email=d.get("email"), telefone=d.get("telefone"),
            endereco=d.get("endereco"), responsavel=d.get("responsavel"),
            ativo=bool(d.get("ativo", True))
        ))
        return jsonify(x.to_dict()),201
    except Exception as e:
        return jsonify({"message":str(e)}),400

@bp.put("/<int:id_>")
def atualizar(id_):
    x = dao.buscar_por_id(id_)
    if not x:
        return jsonify({"message":"Aluno não encontrado."}),404
    d = request.get_json(silent=True) or {}
    for field in ["nome","email","telefone","endereco","responsavel","ativo"]:
        if field in d:
            setattr(x, field, d[field])
    if not str(x.nome or "").strip():
        return jsonify({"message":"Nome é obrigatório."}),400
    x.ativo = bool(x.ativo)
    try:
        return jsonify(dao.atualizar(x).to_dict())
    except Exception as e:
        return jsonify({"message":str(e)}),400

@bp.delete("/<int:id_>")
def excluir(id_):
    if not dao.excluir(id_):
        return jsonify({"message":"Aluno não encontrado."}),404
    return jsonify({"message":"Aluno excluído com sucesso."})
