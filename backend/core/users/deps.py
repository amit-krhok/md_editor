"""FastAPI dependencies for auth.

Use ``Depends(get_current_user)`` on any route that requires an authenticated,
**active** user. Inactive users are rejected here (same as login), so token
issuance and protected APIs stay aligned until you add activation (e.g. OTP).
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from core.users.exceptions import InactiveUserError, UnauthorizedError
from core.users.models import User
from core.users.services import AuthService
from database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    try:
        return await AuthService.get_current_user(db, token)
    except UnauthorizedError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except InactiveUserError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        ) from exc
