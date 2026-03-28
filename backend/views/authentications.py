import logging
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from core.users.schemas import TokenResponse, UserCreate, UserPublic
from core.users.services import AuthService, UserService
from database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])
log = logging.getLogger(__name__)


@router.post("/register", response_model=UserPublic, status_code=201)
async def register(
    body: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserPublic:
    return await UserService.create_user(db, body.email, body.password)


@router.post("/token", response_model=TokenResponse)
async def login_for_access_token(
    db: Annotated[AsyncSession, Depends(get_db)],
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> TokenResponse:
    """OAuth2 password flow. The form field ``username`` is the user's email (OAuth2 naming)."""
    log.info("Login API called")
    token = await AuthService.issue_access_token_for_credentials(
        db, form_data.username, form_data.password
    )
    return TokenResponse(access_token=token)
