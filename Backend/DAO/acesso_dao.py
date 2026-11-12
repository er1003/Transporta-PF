"""Vínculo entre o login (Supabase) e o cadastro de monitora/motorista."""
from ..database import get_connection


class AcessoDAO:
    def _por(self, tabela, coluna, valor):
        if not valor:
            return None
        with get_connection() as c:
            r = c.execute(f"SELECT id, nome FROM {tabela} WHERE {coluna}=? AND ativo=1", (valor,)).fetchone()
        return dict(r) if r else None

    def monitora_por_auth(self, auth_id):
        return self._por("monitoras", "auth_user_id", auth_id)

    def motorista_por_auth(self, auth_id):
        return self._por("motoristas", "auth_user_id", auth_id)

    def _vincular_por_email(self, tabela, email, auth_id):
        """Liga o login ao cadastro pelo e-mail, só se o cadastro ainda não tem login."""
        with get_connection() as c:
            r = c.execute(
                f"SELECT id, nome FROM {tabela} WHERE lower(email)=lower(?) AND ativo=1 AND auth_user_id IS NULL",
                (email,)).fetchone()
            if not r:
                return None
            c.execute(f"UPDATE {tabela} SET auth_user_id=? WHERE id=? AND auth_user_id IS NULL", (auth_id, r["id"]))
        return dict(r)

    def vincular_monitora_por_email(self, email, auth_id):
        return self._vincular_por_email("monitoras", email, auth_id)

    def vincular_motorista_por_email(self, email, auth_id):
        return self._vincular_por_email("motoristas", email, auth_id)

    def definir_email_motorista(self, motorista_id, email):
        with get_connection() as c:
            cur = c.execute("UPDATE motoristas SET email=? WHERE id=?", (email or None, motorista_id))
            return cur.rowcount > 0
