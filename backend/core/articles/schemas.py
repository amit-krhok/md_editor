import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from core.articles.models import ArticleRole


class ArticleCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    content: str = ""
    folder_id: uuid.UUID | None = None


class ArticleMove(BaseModel):
    folder_id: uuid.UUID = Field(description="Folder to move the article into.")


class ArticleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    content: str | None = None
    folder_id: uuid.UUID | None = Field(
        default=None,
        description="Set to null to move the article out of any folder.",
    )
    is_publicly_accessible: bool | None = None


class ArticlePublic(BaseModel):
    model_config = {"from_attributes": True, "use_enum_values": True}

    id: uuid.UUID
    user_id: uuid.UUID
    folder_id: uuid.UUID | None
    title: str
    content: str
    is_publicly_accessible: bool
    role: ArticleRole
    created_at: datetime
    modified_at: datetime
