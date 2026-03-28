from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from core.users.schemas import TokenResponse, UserCreate, UserPublic
from core.users.services import AuthService, UserService
from database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=201)
def register(
    body: UserCreate,
    db: Annotated[Session, Depends(get_db)],
) -> UserPublic:
    return UserService.create_user(db, body.email, body.password)


@router.post("/token", response_model=TokenResponse)
def login_for_access_token(
    db: Annotated[Session, Depends(get_db)],
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> TokenResponse:
    """OAuth2 password flow. The form field ``username`` is the user's email (OAuth2 naming)."""
    token = AuthService.issue_access_token_for_credentials(
        db, form_data.username, form_data.password
    )
    return TokenResponse(access_token=token)
