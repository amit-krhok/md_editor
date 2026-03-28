from __future__ import annotations

import uuid

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.folders.exceptions import FolderNameTakenError, FolderNotFoundError
from core.folders.models import Folder
from core.users.models import User


class FolderService:
    @staticmethod
    async def _get_owned(
        db: AsyncSession, folder_id: uuid.UUID, user_id: uuid.UUID
    ) -> Folder | None:
        result = await db.execute(
            select(Folder).where(
                Folder.id == folder_id,
                Folder.user_id == user_id,
            )
        )
        return result.scalars().first()

    @staticmethod
    async def get_owned_or_raise(
        db: AsyncSession, folder_id: uuid.UUID, user: User
    ) -> Folder:
        folder = await FolderService._get_owned(db, folder_id, user.id)
        if folder is None:
            raise FolderNotFoundError()
        return folder

    @staticmethod
    async def create_folder(db: AsyncSession, user: User, name: str) -> Folder:
        trimmed = name.strip()
        folder = Folder(user_id=user.id, name=trimmed)
        db.add(folder)
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            raise FolderNameTakenError() from None
        await db.refresh(folder)
        return folder

    @staticmethod
    async def list_folders(db: AsyncSession, user: User) -> list[Folder]:
        result = await db.execute(
            select(Folder)
            .where(Folder.user_id == user.id)
            .order_by(Folder.name)
        )
        return list(result.scalars().all())

    @staticmethod
    async def update_folder(
        db: AsyncSession, user: User, folder_id: uuid.UUID, name: str
    ) -> Folder:
        folder = await FolderService.get_owned_or_raise(db, folder_id, user)
        folder.name = name.strip()
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            raise FolderNameTakenError() from None
        await db.refresh(folder)
        return folder

    @staticmethod
    async def delete_folder(db: AsyncSession, user: User, folder_id: uuid.UUID) -> None:
        await FolderService.get_owned_or_raise(db, folder_id, user)
        await db.execute(delete(Folder).where(Folder.id == folder_id))
        await db.commit()
