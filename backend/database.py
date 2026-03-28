import os
from collections.abc import AsyncGenerator
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

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


def _async_database_url(url: str) -> str:
    if "+asyncpg" in url:
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    raise RuntimeError(
        "DATABASE_URL must be a postgresql:// or postgres:// URL (asyncpg driver is used)."
    )


class Base(DeclarativeBase):
    pass


async_engine = create_async_engine(
    _async_database_url(DATABASE_URL),
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={
        "statement_cache_size": 0,
    },
)
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
