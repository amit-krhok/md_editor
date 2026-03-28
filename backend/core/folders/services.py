from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.folders.exceptions import FolderNameTakenError, FolderNotFoundError
from core.folders.models import Folder
from core.users.models import User


class FolderService:
    @staticmethod
    def _get_owned(
        db: Session, folder_id: uuid.UUID, user_id: uuid.UUID
    ) -> Folder | None:
        return db.scalars(
            select(Folder).where(
                Folder.id == folder_id,
                Folder.user_id == user_id,
            )
        ).first()

    @staticmethod
    def get_owned_or_raise(db: Session, folder_id: uuid.UUID, user: User) -> Folder:
        folder = FolderService._get_owned(db, folder_id, user.id)
        if folder is None:
            raise FolderNotFoundError()
        return folder

    @staticmethod
    def create_folder(db: Session, user: User, name: str) -> Folder:
        trimmed = name.strip()
        folder = Folder(user_id=user.id, name=trimmed)
        db.add(folder)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise FolderNameTakenError() from None
        db.refresh(folder)
        return folder

    @staticmethod
    def list_folders(db: Session, user: User) -> list[Folder]:
        return list(
            db.scalars(
                select(Folder)
                .where(Folder.user_id == user.id)
                .order_by(Folder.name)
            ).all()
        )

    @staticmethod
    def update_folder(db: Session, user: User, folder_id: uuid.UUID, name: str) -> Folder:
        folder = FolderService.get_owned_or_raise(db, folder_id, user)
        folder.name = name.strip()
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise FolderNameTakenError() from None
        db.refresh(folder)
        return folder

    @staticmethod
    def delete_folder(db: Session, user: User, folder_id: uuid.UUID) -> None:
        folder = FolderService.get_owned_or_raise(db, folder_id, user)
        db.delete(folder)
        db.commit()
