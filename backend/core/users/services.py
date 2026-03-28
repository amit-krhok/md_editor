from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core import config
from core.users.exceptions import (
    InactiveUserError,
    IncorrectCurrentPasswordError,
    InvalidCredentialsError,
    UnauthorizedError,
    UserAlreadyExistsError,
    WeakPasswordError,
)
from core.users.models import User
from core.utils.jwt_payload import build_access_token_payload
from core.utils.password_strength import validate_strong_password


def _bcrypt_hash_password(pwd: bytes) -> str:
    return bcrypt.hashpw(pwd, bcrypt.gensalt()).decode("ascii")


def _bcrypt_verify_password(pwd: bytes, hashed_ascii: bytes) -> bool:
    try:
        return bcrypt.checkpw(pwd, hashed_ascii)
    except (ValueError, TypeError):
        return False


def _jwt_encode(payload: dict, secret: str, algorithm: str) -> str:
    return jwt.encode(payload, secret, algorithm=algorithm)


def _jwt_decode(token: str, secret: str, algorithms: list[str]) -> dict:
    return jwt.decode(token, secret, algorithms=algorithms)


class UserService:
    @staticmethod
    async def hash_password(plain_password: str) -> str:
        pwd = plain_password.encode("utf-8")
        if len(pwd) > 72:
            pwd = pwd[:72]
        return await asyncio.to_thread(_bcrypt_hash_password, pwd)

    @staticmethod
    async def verify_password(plain_password: str, hashed_password: str) -> bool:
        pwd = plain_password.encode("utf-8")
        if len(pwd) > 72:
            pwd = pwd[:72]
        hashed = hashed_password.encode("ascii")
        return await asyncio.to_thread(_bcrypt_verify_password, pwd, hashed)

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> User | None:
        normalized = email.strip().lower()
        result = await db.execute(select(User).where(User.email == normalized))
        return result.scalars().first()

    @staticmethod
    async def create_user(db: AsyncSession, email: str, password: str) -> User:
        validate_strong_password(password)
        normalized = email.strip().lower()
        if await UserService.get_by_email(db, normalized):
            raise UserAlreadyExistsError()
        is_active = normalized in config.SUPERUSER_EMAILS
        hashed = await UserService.hash_password(password)
        user = User(
            email=normalized,
            hashed_password=hashed,
            is_active=is_active,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def change_password(
        db: AsyncSession, user: User, old_password: str, new_password: str
    ) -> None:
        if not await UserService.verify_password(old_password, user.hashed_password):
            raise IncorrectCurrentPasswordError()
        if await UserService.verify_password(new_password, user.hashed_password):
            raise WeakPasswordError(
                ["New password must be different from the current password"]
            )
        validate_strong_password(new_password)
        user.hashed_password = await UserService.hash_password(new_password)
        db.add(user)
        await db.commit()


class AuthService:
    @staticmethod
    def _require_jwt_secret() -> None:
        if not config.JWT_SECRET_KEY:
            raise RuntimeError("JWT_SECRET_KEY is not set")

    @staticmethod
    async def create_access_token(user_id: uuid.UUID) -> str:
        AuthService._require_jwt_secret()
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        payload = build_access_token_payload(user_id, expires_at)
        return await asyncio.to_thread(
            _jwt_encode,
            payload,
            config.JWT_SECRET_KEY,
            config.JWT_ALGORITHM,
        )

    @staticmethod
    async def decode_token_subject(token: str) -> uuid.UUID:
        AuthService._require_jwt_secret()
        try:
            payload = await asyncio.to_thread(
                _jwt_decode,
                token,
                config.JWT_SECRET_KEY,
                [config.JWT_ALGORITHM],
            )
            sub = payload.get("sub")
            if sub is None:
                raise UnauthorizedError()
            return uuid.UUID(str(sub))
        except (JWTError, ValueError, TypeError):
            raise UnauthorizedError() from None

    @staticmethod
    async def authenticate(db: AsyncSession, email: str, password: str) -> User:
        normalized = email.strip().lower()
        user = await UserService.get_by_email(db, normalized)
        if user is None or not await UserService.verify_password(
            password, user.hashed_password
        ):
            raise InvalidCredentialsError()
        if not user.is_active:
            raise InactiveUserError()
        return user

    @staticmethod
    async def get_current_user(db: AsyncSession, token: str) -> User:
        user_id = await AuthService.decode_token_subject(token)
        user = await UserService.get_by_id(db, user_id)
        if user is None:
            raise UnauthorizedError()
        if not user.is_active:
            raise InactiveUserError()
        return user

    @staticmethod
    async def issue_access_token_for_credentials(
        db: AsyncSession, email: str, password: str
    ) -> str:
        user = await AuthService.authenticate(db, email, password)
        return await AuthService.create_access_token(user.id)
