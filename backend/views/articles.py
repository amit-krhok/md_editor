import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from core.articles.schemas import (
    ArticleCreate,
    ArticleMove,
    ArticlePublic,
    ArticleUpdate,
)
from core.articles.services import ArticleService
from core.users.deps import get_current_user
from core.users.models import User
from database import get_db

router = APIRouter(prefix="/articles", tags=["articles"])


@router.post("/", response_model=ArticlePublic, status_code=status.HTTP_201_CREATED)
def create_article(
    body: ArticleCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ArticlePublic:
    return ArticleService.create_article(
        db,
        current_user,
        body.title,
        body.content,
        body.folder_id,
    )


@router.get("/", response_model=list[ArticlePublic])
def list_articles(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    folder_id: Annotated[
        uuid.UUID | None,
        Query(description="Only articles in this folder."),
    ] = None,
    without_folder: Annotated[
        bool,
        Query(
            description="If true, only articles with no folder (ignores folder_id).",
        ),
    ] = False,
) -> list[ArticlePublic]:
    return ArticleService.list_articles(
        db,
        current_user,
        folder_id=folder_id,
        without_folder=without_folder,
    )


@router.post("/{article_id}/move", response_model=ArticlePublic)
def move_article(
    article_id: uuid.UUID,
    body: ArticleMove,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ArticlePublic:
    return ArticleService.move_article(db, current_user, article_id, body.folder_id)


@router.get("/{article_id}", response_model=ArticlePublic)
def get_article(
    article_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ArticlePublic:
    return ArticleService.get_owned_or_raise(db, article_id, current_user)


@router.patch("/{article_id}", response_model=ArticlePublic)
def update_article(
    article_id: uuid.UUID,
    body: ArticleUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ArticlePublic:
    return ArticleService.update_article(db, current_user, article_id, body)


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_article(
    article_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    ArticleService.delete_article(db, current_user, article_id)
