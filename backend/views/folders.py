import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from core.folders.schemas import FolderCreate, FolderPublic, FolderUpdate
from core.folders.services import FolderService
from core.users.deps import get_current_user
from core.users.models import User
from database import get_db

router = APIRouter(prefix="/folders", tags=["folders"])


@router.post("/", response_model=FolderPublic, status_code=status.HTTP_201_CREATED)
def create_folder(
    body: FolderCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FolderPublic:
    return FolderService.create_folder(db, current_user, body.name)


@router.get("/", response_model=list[FolderPublic])
def list_folders(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[FolderPublic]:
    return FolderService.list_folders(db, current_user)


@router.get("/{folder_id}", response_model=FolderPublic)
def get_folder(
    folder_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FolderPublic:
    return FolderService.get_owned_or_raise(db, folder_id, current_user)


@router.patch("/{folder_id}", response_model=FolderPublic)
def update_folder(
    folder_id: uuid.UUID,
    body: FolderUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FolderPublic:
    return FolderService.update_folder(db, current_user, folder_id, body.name)


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    folder_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    FolderService.delete_folder(db, current_user, folder_id)
