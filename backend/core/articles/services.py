from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from core.articles.exceptions import ArticleNotFoundError
from core.articles.models import Article, ArticleRole
from core.articles.schemas import ArticleUpdate
from core.folders.services import FolderService
from core.users.models import User


class ArticleService:
    @staticmethod
    def _get_owned(
        db: Session, article_id: uuid.UUID, user_id: uuid.UUID
    ) -> Article | None:
        return db.scalars(
            select(Article).where(
                Article.id == article_id,
                Article.user_id == user_id,
            )
        ).first()

    @staticmethod
    def get_owned_or_raise(db: Session, article_id: uuid.UUID, user: User) -> Article:
        article = ArticleService._get_owned(db, article_id, user.id)
        if article is None:
            raise ArticleNotFoundError()
        return article

    @staticmethod
    def _resolve_folder(
        db: Session, user: User, folder_id: uuid.UUID | None
    ) -> uuid.UUID | None:
        if folder_id is None:
            return None
        FolderService.get_owned_or_raise(db, folder_id, user)
        return folder_id

    @staticmethod
    def create_article(
        db: Session,
        user: User,
        title: str,
        content: str,
        folder_id: uuid.UUID | None,
    ) -> Article:
        fid = ArticleService._resolve_folder(db, user, folder_id)
        article = Article(
            user_id=user.id,
            folder_id=fid,
            title=title.strip(),
            content=content,
            role=ArticleRole.owner,
        )
        db.add(article)
        db.commit()
        db.refresh(article)
        return article

    @staticmethod
    def move_article(
        db: Session,
        user: User,
        article_id: uuid.UUID,
        folder_id: uuid.UUID,
    ) -> Article:
        article = ArticleService.get_owned_or_raise(db, article_id, user)
        resolved = ArticleService._resolve_folder(db, user, folder_id)
        article.folder_id = resolved
        db.commit()
        db.refresh(article)
        return article

    @staticmethod
    def list_articles(
        db: Session,
        user: User,
        *,
        folder_id: uuid.UUID | None = None,
        without_folder: bool = False,
    ) -> list[Article]:
        q = select(Article).where(Article.user_id == user.id)
        if without_folder:
            q = q.where(Article.folder_id.is_(None))
        elif folder_id is not None:
            q = q.where(Article.folder_id == folder_id)
        q = q.order_by(Article.modified_at.desc())
        return list(db.scalars(q).all())

    @staticmethod
    def update_article(
        db: Session, user: User, article_id: uuid.UUID, body: ArticleUpdate
    ) -> Article:
        article = ArticleService.get_owned_or_raise(db, article_id, user)
        data = body.model_dump(exclude_unset=True)
        if "title" in data:
            article.title = data["title"].strip()
        if "content" in data:
            article.content = data["content"]
        if "folder_id" in data:
            article.folder_id = ArticleService._resolve_folder(
                db, user, data["folder_id"]
            )
        db.commit()
        db.refresh(article)
        return article

    @staticmethod
    def delete_article(db: Session, user: User, article_id: uuid.UUID) -> None:
        article = ArticleService.get_owned_or_raise(db, article_id, user)
        db.delete(article)
        db.commit()
