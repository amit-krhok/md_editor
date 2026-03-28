"""Application logging: rotating file under LOG_DIR plus propagation from uvicorn loggers."""

from __future__ import annotations

import logging
import logging.handlers
import os
from pathlib import Path

_configured = False


def _log_dir() -> Path:
    env = (os.getenv("LOG_DIR") or "").strip()
    if env:
        return Path(env)
    return Path(__file__).resolve().parent / "logs"


def configure() -> None:
    global _configured
    if _configured:
        return
    _configured = True

    log_dir = _log_dir()
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = (log_dir / "app.log").resolve()

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    file_handler = logging.handlers.RotatingFileHandler(
        log_path,
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)

    root = logging.getLogger()
    root.setLevel(logging.INFO)
    if not any(
        isinstance(h, logging.handlers.RotatingFileHandler)
        and getattr(h, "baseFilename", None) == str(log_path)
        for h in root.handlers
    ):
        root.addHandler(file_handler)

    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        logging.getLogger(name).propagate = True
