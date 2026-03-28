import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class FolderUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class FolderPublic(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    created_at: datetime
    modified_at: datetime
