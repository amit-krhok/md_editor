import os


def _parse_superuser_emails() -> frozenset[str]:
    raw = os.getenv("SUPERUSER_EMAILS", "") or ""
    return frozenset(part.strip().lower() for part in raw.split(",") if part.strip())


JWT_SECRET_KEY = (os.getenv("JWT_SECRET_KEY") or "").strip()
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256").strip() or "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
SUPERUSER_EMAILS = _parse_superuser_emails()

# Browser Origin when UI is on another host/port (e.g. Next.js). Set CORS_ORIGINS in production.
# 0.0.0.0: some dev setups open the UI with that host; LAN IPs need CORS_ORIGINS.
_DEFAULT_CORS_REGEX = r"https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$"


def cors_middleware_kwargs() -> dict:
    """Starlette CORSMiddleware kwargs. Prefer CORS_ORIGINS in production."""
    origins = [
        o.strip() for o in (os.getenv("CORS_ORIGINS") or "").split(",") if o.strip()
    ]
    regex = (os.getenv("CORS_ORIGIN_REGEX") or "").strip()
    kw: dict = {
        "allow_credentials": True,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
    }
    if origins:
        kw["allow_origins"] = origins
        if regex:
            kw["allow_origin_regex"] = regex
        return kw
    kw["allow_origin_regex"] = regex or _DEFAULT_CORS_REGEX
    return kw
