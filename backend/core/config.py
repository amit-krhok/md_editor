import os


def _parse_superuser_emails() -> frozenset[str]:
    raw = os.getenv("SUPERUSER_EMAILS", "") or ""
    return frozenset(part.strip().lower() for part in raw.split(",") if part.strip())


JWT_SECRET_KEY = (os.getenv("JWT_SECRET_KEY") or "").strip()
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256").strip() or "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
SUPERUSER_EMAILS = _parse_superuser_emails()
