from __future__ import annotations

import string

from core.users.exceptions import WeakPasswordError

MIN_PASSWORD_LENGTH = 12
MAX_PASSWORD_BYTES = 72


def validate_strong_password(password: str) -> None:
    """
    Enforce a strong password policy. Raises WeakPasswordError with all failed rules.
    Bcrypt accepts at most 72 bytes; longer passwords are rejected.
    """
    reasons: list[str] = []

    if len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        reasons.append(f"Password must be at most {MAX_PASSWORD_BYTES} bytes (bcrypt limit)")

    if len(password) < MIN_PASSWORD_LENGTH:
        reasons.append(f"At least {MIN_PASSWORD_LENGTH} characters")

    if not any(c.islower() for c in password):
        reasons.append("At least one lowercase letter")

    if not any(c.isupper() for c in password):
        reasons.append("At least one uppercase letter")

    if not any(c.isdigit() for c in password):
        reasons.append("At least one digit")

    if not any(c in string.punctuation for c in password):
        reasons.append("At least one ASCII punctuation character")

    if reasons:
        raise WeakPasswordError(reasons)
