import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.folders.schemas import FolderCreate, FolderPublic, FolderUpdate
from core.folders.services import FolderService
from core.users.deps import get_current_user
from core.users.models import User
from database import get_db

router = APIRouter(prefix="/folders", tags=["folders"])


@router.post("/", response_model=FolderPublic, status_code=status.HTTP_201_CREATED)
async def create_folder(
    body: FolderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FolderPublic:
    return await FolderService.create_folder(db, current_user, body.name)


@router.get("/", response_model=list[FolderPublic])
async def list_folders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[FolderPublic]:
    return await FolderService.list_folders(db, current_user)


@router.get("/{folder_id}", response_model=FolderPublic)
async def get_folder(
    folder_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FolderPublic:
    return await FolderService.get_owned_or_raise(db, folder_id, current_user)


@router.patch("/{folder_id}", response_model=FolderPublic)
async def update_folder(
    folder_id: uuid.UUID,
    body: FolderUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FolderPublic:
    return await FolderService.update_folder(
        db, current_user, folder_id, body.name
    )


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    await FolderService.delete_folder(db, current_user, folder_id)
