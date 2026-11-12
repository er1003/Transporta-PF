from dataclasses import dataclass
from typing import Optional

@dataclass
class Viagem:
    id: Optional[int] = None
    data_viagem: str = ""
    origem: Optional[str] = None
    destino: Optional[str] = None
    motorista_id: Optional[int] = None
    veiculo_id: Optional[int] = None
    status: str = "planejada"
<<<<<<< HEAD
    escola_id: Optional[int] = None
    turno: Optional[str] = None
    horario: Optional[str] = None
    monitora_id: Optional[int] = None
=======
>>>>>>> f87bf6d39891476c1ebdb9ddabb213f75f09b035

    @classmethod
    def from_row(cls, row):
        return cls(
            id=row["id"], data_viagem=row["data_viagem"],
            origem=row["origem"], destino=row["destino"],
            motorista_id=row["motorista_id"], veiculo_id=row["veiculo_id"],
<<<<<<< HEAD
            status=row["status"], escola_id=row["escola_id"],
            turno=row["turno"], horario=row["horario"],
            monitora_id=row["monitora_id"]
=======
            status=row["status"]
>>>>>>> f87bf6d39891476c1ebdb9ddabb213f75f09b035
        )

    def to_dict(self):
        return self.__dict__
