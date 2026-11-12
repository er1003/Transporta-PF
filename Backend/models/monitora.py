from dataclasses import dataclass
from typing import Optional

@dataclass
class Monitora:
    id: Optional[int] = None
    nome: str = ""
    telefone: Optional[str] = None
    email: Optional[str] = None
    auth_user_id: Optional[str] = None
    ativo: bool = True

    @classmethod
    def from_row(cls, row):
        return cls(
            id=row["id"], nome=row["nome"], telefone=row["telefone"],
            email=row["email"], auth_user_id=row["auth_user_id"],
            ativo=bool(row["ativo"])
        )

    def to_dict(self):
        return self.__dict__
