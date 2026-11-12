from dataclasses import dataclass
from typing import Optional

@dataclass
class Veiculo:
    id: Optional[int] = None
    placa: str = ""
    modelo: Optional[str] = None
    capacidade: int = 0
    ativo: bool = True

    @classmethod
    def from_row(cls, row):
        return cls(
            id=row["id"], placa=row["placa"], modelo=row["modelo"],
            capacidade=row["capacidade"], ativo=bool(row["ativo"])
        )

    def to_dict(self):
        return self.__dict__
