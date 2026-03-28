import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

_backend_dir = Path(__file__).resolve().parent
_repo_root = _backend_dir.parent
for _env_path in (_repo_root / ".env", _backend_dir / ".env"):
    if _env_path.is_file():
        load_dotenv(_env_path)
        break

DATABASE_URL = (os.getenv("DATABASE_URL") or "").strip() or None
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Add it to .env (see .env.example in the repo root)."
    )


class Base(DeclarativeBase):
    pass


engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
