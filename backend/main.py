from fastapi import FastAPI, HTTPException
from sqlalchemy import text

from database import engine

app = FastAPI(title="md_editor API")


@app.get("/test")
def test():
    """Smoke test: API up and database reachable."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="database unavailable",
        ) from exc
    return {"status": "ok", "database": "connected"}
