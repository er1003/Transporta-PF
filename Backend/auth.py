"""Autenticação e permissões da API.

O front-end envia o token do Supabase (Authorization: Bearer ...). Aqui o servidor:
  1. confirma o token perguntando ao próprio Supabase (/auth/v1/user) — nada que o usuário
     possa editar no navegador (como user_metadata) é usado para dar permissão;
  2. descobre o papel pelo BANCO: monitora/motorista vinculados ao login, ou administrador
     listado em TRANSPORTAPF_ADMINS (e-mails separados por vírgula).
Quando o módulo de controle de acesso do projeto tiver papéis próprios, basta ajustar
`resolver_usuario` — o restante do sistema usa apenas `usuario_atual()` e os decoradores.
"""
import json
import os
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from typing import List, Optional

from flask import g, jsonify, request

from .DAO.acesso_dao import AcessoDAO

SUPABASE_URL = os.getenv("TRANSPORTAPF_SUPABASE_URL", "https://gzdjbvkfzctdylvqczyn.supabase.co").rstrip("/")
# Chave pública (publishable), a mesma já usada em supabase/supabase.js
SUPABASE_KEY = os.getenv("TRANSPORTAPF_SUPABASE_KEY", "sb_publishable_NI3vYIdfPs6B43dRLYNuuQ_-ZHhRha-")
_TTL = 60  # segundos de cache por token, para não consultar o Supabase a cada clique
_cache = {}
_dao = AcessoDAO()


class AuthIndisponivel(Exception):
    pass


@dataclass
class Usuario:
    auth_id: str
    email: str
    nome: str
    admin: bool = False
    monitora_id: Optional[int] = None
    monitora_nome: Optional[str] = None
    motorista_id: Optional[int] = None
    motorista_nome: Optional[str] = None
    papeis: List[str] = field(default_factory=list)

    @property
    def papel(self):
        return self.papeis[0] if self.papeis else "sem_papel"

    def to_dict(self):
        return {
            "auth_id": self.auth_id, "email": self.email, "nome": self.nome,
            "papel": self.papel, "papeis": self.papeis,
            "monitora_id": self.monitora_id, "motorista_id": self.motorista_id,
        }


def verificar_token(token):
    """Valida o token no Supabase. Retorna {id,email,nome,email_confirmado} ou None."""
    agora = time.time()
    hit = _cache.get(token)
    if hit and hit[0] > agora:
        return hit[1]
    req = urllib.request.Request(
        SUPABASE_URL + "/auth/v1/user",
        headers={"apikey": SUPABASE_KEY, "Authorization": "Bearer " + token})
    try:
        with urllib.request.urlopen(req, timeout=6) as r:
            dados = json.load(r)
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            return None
        raise AuthIndisponivel(str(e))
    except Exception as e:  # rede fora do ar, timeout...
        raise AuthIndisponivel(str(e))
    info = {
        "id": dados.get("id"), "email": (dados.get("email") or "").lower(),
        "nome": (dados.get("user_metadata") or {}).get("full_name") or dados.get("email") or "",
        "email_confirmado": bool(dados.get("email_confirmed_at") or dados.get("confirmed_at")),
    }
    if len(_cache) > 500:
        _cache.clear()
    _cache[token] = (agora + _TTL, info)
    return info


def resolver_usuario(info):
    admins = {x.strip().lower() for x in os.getenv("TRANSPORTAPF_ADMINS", "").split(",") if x.strip()}
    u = Usuario(auth_id=info["id"], email=info["email"], nome=info["nome"])
    u.admin = info["email"] in admins or info["id"] in admins
    mon = _dao.monitora_por_auth(info["id"])
    mot = _dao.motorista_por_auth(info["id"])
    if info.get("email_confirmado") and info["email"]:  # só vincula por e-mail já confirmado
        mon = mon or _dao.vincular_monitora_por_email(info["email"], info["id"])
        mot = mot or _dao.vincular_motorista_por_email(info["email"], info["id"])
    if u.admin:
        u.papeis.append("admin")
    if mon:
        u.monitora_id, u.monitora_nome = mon["id"], mon["nome"]
        u.papeis.append("monitora")
    if mot:
        u.motorista_id, u.motorista_nome = mot["id"], mot["nome"]
        u.papeis.append("motorista")
    return u


def usuario_atual():
    """Usuário autenticado da requisição, ou None. Levanta AuthIndisponivel se o Supabase não responde."""
    if hasattr(g, "_usuario"):
        return g._usuario
    cab = request.headers.get("Authorization", "")
    g._usuario = None
    if cab.startswith("Bearer ") and cab[7:].strip():
        info = verificar_token(cab[7:].strip())
        if info and info.get("id"):
            g._usuario = resolver_usuario(info)
    return g._usuario


def _negar(msg, codigo):
    return jsonify({"message": msg}), codigo


def checar(*papeis):
    """None se permitido; senão a resposta de erro. Sem papéis = qualquer usuário autenticado."""
    if request.method == "OPTIONS":  # pré-voo do CORS não carrega token
        return None
    try:
        u = usuario_atual()
    except AuthIndisponivel:
        return _negar("Não foi possível confirmar seu acesso agora. Tente novamente em instantes.", 503)
    if not u:
        return _negar("Sessão expirada ou inválida. Entre novamente.", 401)
    if papeis and not (set(papeis) & set(u.papeis)):
        return _negar("Você não tem permissão para acessar esta função.", 403)
    return None


def exigir_admin():
    """Para usar em Blueprint.before_request."""
    return checar("admin")
