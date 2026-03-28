from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

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


class UserService:
    @staticmethod
    def hash_password(plain_password: str) -> str:
        pwd = plain_password.encode("utf-8")
        if len(pwd) > 72:
            pwd = pwd[:72]
        return bcrypt.hashpw(pwd, bcrypt.gensalt()).decode("ascii")

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        pwd = plain_password.encode("utf-8")
        if len(pwd) > 72:
            pwd = pwd[:72]
        try:
            return bcrypt.checkpw(pwd, hashed_password.encode("ascii"))
        except (ValueError, TypeError):
            return False

    @staticmethod
    def get_by_id(db: Session, user_id: uuid.UUID) -> User | None:
        return db.scalars(select(User).where(User.id == user_id)).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> User | None:
        normalized = email.strip().lower()
        return db.scalars(select(User).where(User.email == normalized)).first()

    @staticmethod
    def create_user(db: Session, email: str, password: str) -> User:
        validate_strong_password(password)
        normalized = email.strip().lower()
        if UserService.get_by_email(db, normalized):
            raise UserAlreadyExistsError()
        is_active = normalized in config.SUPERUSER_EMAILS
        user = User(
            email=normalized,
            hashed_password=UserService.hash_password(password),
            is_active=is_active,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def change_password(
        db: Session, user: User, old_password: str, new_password: str
    ) -> None:
        if not UserService.verify_password(old_password, user.hashed_password):
            raise IncorrectCurrentPasswordError()
        if UserService.verify_password(new_password, user.hashed_password):
            raise WeakPasswordError(
                ["New password must be different from the current password"]
            )
        validate_strong_password(new_password)
        user.hashed_password = UserService.hash_password(new_password)
        db.add(user)
        db.commit()


class AuthService:
    @staticmethod
    def _require_jwt_secret() -> None:
        if not config.JWT_SECRET_KEY:
            raise RuntimeError("JWT_SECRET_KEY is not set")

    @staticmethod
    def create_access_token(user_id: uuid.UUID) -> str:
        AuthService._require_jwt_secret()
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        payload = build_access_token_payload(user_id, expires_at)
        return jwt.encode(
            payload, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM
        )

    @staticmethod
    def decode_token_subject(token: str) -> uuid.UUID:
        AuthService._require_jwt_secret()
        try:
            payload = jwt.decode(
                token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM]
            )
            sub = payload.get("sub")
            if sub is None:
                raise UnauthorizedError()
            return uuid.UUID(str(sub))
        except (JWTError, ValueError, TypeError):
            raise UnauthorizedError() from None

    @staticmethod
    def authenticate(db: Session, email: str, password: str) -> User:
        normalized = email.strip().lower()
        user = UserService.get_by_email(db, normalized)
        if user is None or not UserService.verify_password(
            password, user.hashed_password
        ):
            raise InvalidCredentialsError()
        if not user.is_active:
            raise InactiveUserError()
        return user

    @staticmethod
    def get_current_user(db: Session, token: str) -> User:
        user_id = AuthService.decode_token_subject(token)
        user = UserService.get_by_id(db, user_id)
        if user is None:
            raise UnauthorizedError()
        if not user.is_active:
            raise InactiveUserError()
        return user

    @staticmethod
    def issue_access_token_for_credentials(
        db: Session, email: str, password: str
    ) -> str:
        user = AuthService.authenticate(db, email, password)
        return AuthService.create_access_token(user.id)
