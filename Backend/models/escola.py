from dataclasses import dataclass
from typing import Optional

@dataclass
class Escola:
    id: Optional[int] = None
    nome: str = ""
    ativo: bool = True

    @classmethod
    def from_row(cls, row):
        return cls(id=row["id"], nome=row["nome"], ativo=bool(row["ativo"]))

    def to_dict(self):
        return self.__dict__
