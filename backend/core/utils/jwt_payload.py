from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any


def build_access_token_payload(user_id: uuid.UUID, expires_at: datetime) -> dict[str, Any]:
    """Build JWT claims for access tokens. All access-token fields should be defined here."""
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return {
        "sub": str(user_id),
        "exp": int(expires_at.timestamp()),
    }
