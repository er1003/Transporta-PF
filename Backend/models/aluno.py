from dataclasses import dataclass
from typing import Optional

@dataclass
class Aluno:
    id: Optional[int] = None
    nome: str = ""
    email: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    responsavel: Optional[str] = None
    ativo: bool = True

    @classmethod
    def from_row(cls, row):
        return cls(
            id=row["id"], nome=row["nome"], email=row["email"],
            telefone=row["telefone"], endereco=row["endereco"],
            responsavel=row["responsavel"], ativo=bool(row["ativo"])
        )

    def to_dict(self):
        return self.__dict__
