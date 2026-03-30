from __future__ import annotations

import uuid

from sqlalchemy import delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.articles.exceptions import ArticleNotFoundError
from core.articles.models import Article, ArticleRole
from core.articles.schemas import ArticleUpdate
from core.folders.services import FolderService
from core.users.models import User


class ArticleService:
    @staticmethod
    async def _get_owned(
        db: AsyncSession, article_id: uuid.UUID, user_id: uuid.UUID
    ) -> Article | None:
        result = await db.execute(
            select(Article).where(
                Article.id == article_id,
                Article.user_id == user_id,
            )
        )
        return result.scalars().first()

    @staticmethod
    async def get_owned_or_raise(
        db: AsyncSession, article_id: uuid.UUID, user: User
    ) -> Article:
        article = await ArticleService._get_owned(db, article_id, user.id)
        if article is None:
            raise ArticleNotFoundError()
        return article

    @staticmethod
    async def get_public_or_raise(db: AsyncSession, article_id: uuid.UUID) -> Article:
        result = await db.execute(
            select(Article).where(
                Article.id == article_id,
                Article.is_publicly_accessible.is_(True),
            )
        )
        article = result.scalars().first()
        if article is None:
            raise ArticleNotFoundError()
        return article

    @staticmethod
    async def _resolve_folder(
        db: AsyncSession, user: User, folder_id: uuid.UUID | None
    ) -> uuid.UUID | None:
        if folder_id is None:
            return None
        await FolderService.get_owned_or_raise(db, folder_id, user)
        return folder_id

    @staticmethod
    async def create_article(
        db: AsyncSession,
        user: User,
        title: str,
        content: str,
        folder_id: uuid.UUID | None,
    ) -> Article:
        fid = await ArticleService._resolve_folder(db, user, folder_id)
        article = Article(
            user_id=user.id,
            folder_id=fid,
            title=title.strip(),
            content=content,
            role=ArticleRole.owner,
        )
        db.add(article)
        await db.commit()
        await db.refresh(article)
        return article

    @staticmethod
    async def move_article(
        db: AsyncSession,
        user: User,
        article_id: uuid.UUID,
        folder_id: uuid.UUID,
    ) -> Article:
        article = await ArticleService.get_owned_or_raise(db, article_id, user)
        resolved = await ArticleService._resolve_folder(db, user, folder_id)
        article.folder_id = resolved
        await db.commit()
        await db.refresh(article)
        return article

    @staticmethod
    async def list_articles(
        db: AsyncSession,
        user: User,
        *,
        folder_id: uuid.UUID | None = None,
        without_folder: bool = False,
        search: str | None = None,
    ) -> list[Article]:
        q = select(Article).where(Article.user_id == user.id)
        if without_folder:
            q = q.where(Article.folder_id.is_(None))
        elif folder_id is not None:
            q = q.where(Article.folder_id == folder_id)
        if search is not None and search.strip():
            term = f"%{search.strip()}%"
            q = q.where(
                or_(
                    Article.title.ilike(term),
                    Article.content.ilike(term),
                )
            )
        q = q.order_by(Article.modified_at.desc())
        result = await db.execute(q)
        return list(result.scalars().all())

    @staticmethod
    async def update_article(
        db: AsyncSession, user: User, article_id: uuid.UUID, body: ArticleUpdate
    ) -> Article:
        article = await ArticleService.get_owned_or_raise(db, article_id, user)
        data = body.model_dump(exclude_unset=True)
        if "title" in data:
            article.title = data["title"].strip()
        if "content" in data:
            article.content = data["content"]
        if "folder_id" in data:
            article.folder_id = await ArticleService._resolve_folder(
                db, user, data["folder_id"]
            )
        if "is_publicly_accessible" in data:
            article.is_publicly_accessible = data["is_publicly_accessible"]
        await db.commit()
        await db.refresh(article)
        return article

    @staticmethod
    async def delete_article(
        db: AsyncSession, user: User, article_id: uuid.UUID
    ) -> None:
        await ArticleService.get_owned_or_raise(db, article_id, user)
        await db.execute(delete(Article).where(Article.id == article_id))
        await db.commit()
