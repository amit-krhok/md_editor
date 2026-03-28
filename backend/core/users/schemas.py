import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=1,
        max_length=128,
        description="Validated by strong-password rules in the service layer.",
    )


class PasswordChange(BaseModel):
    old_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=1, max_length=128)


class UserPublic(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: str
    is_active: bool
    created_at: datetime
    modified_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
