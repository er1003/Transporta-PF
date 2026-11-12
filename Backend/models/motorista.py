from dataclasses import dataclass
from typing import Optional

@dataclass
class Motorista:
    id: Optional[int] = None
    nome: str = ""
    cnh: str = ""
    telefone: Optional[str] = None
    ativo: bool = True

    @classmethod
    def from_row(cls, row):
        return cls(
            id=row["id"], nome=row["nome"], cnh=row["cnh"],
            telefone=row["telefone"], ativo=bool(row["ativo"])
        )

    def to_dict(self):
        return self.__dict__
