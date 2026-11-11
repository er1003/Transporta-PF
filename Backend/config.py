import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
INSTANCE_DIR = BASE_DIR / "instance"
INSTANCE_DIR.mkdir(exist_ok=True)

DATABASE_PATH = os.getenv(
    "TRANSPORTAPF_DATABASE",
    str(INSTANCE_DIR / "transportapf.db")
)
