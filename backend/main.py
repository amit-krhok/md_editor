import logging

import logging_setup

logging_setup.configure()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.requests import Request

from core import config
from core.articles.exceptions import ArticleNotFoundError
from core.folders.exceptions import FolderNameTakenError, FolderNotFoundError
from core.users.exceptions import (
    InactiveUserError,
    IncorrectCurrentPasswordError,
    InvalidCredentialsError,
    UserAlreadyExistsError,
    WeakPasswordError,
)
from database import async_engine
from views.articles import router as articles_router
from views.authentications import router as auth_router
from views.folders import router as folders_router
from views.users import router as users_router

app = FastAPI(title="md_editor API")

app.add_middleware(CORSMiddleware, **config.cors_middleware_kwargs())

log = logging.getLogger("md_editor.api")

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(folders_router)
app.include_router(articles_router)


@app.exception_handler(UserAlreadyExistsError)
async def user_already_exists_handler(
    _request: Request, _exc: UserAlreadyExistsError
) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={"detail": "Email already registered"},
    )


@app.exception_handler(InvalidCredentialsError)
async def invalid_credentials_handler(
    _request: Request, _exc: InvalidCredentialsError
) -> JSONResponse:
    return JSONResponse(
        status_code=401,
        content={"detail": "Incorrect email or password"},
        headers={"WWW-Authenticate": "Bearer"},
    )


@app.exception_handler(InactiveUserError)
async def inactive_user_handler(
    _request: Request, _exc: InactiveUserError
) -> JSONResponse:
    return JSONResponse(
        status_code=403,
        content={"detail": "Inactive user"},
    )


@app.exception_handler(WeakPasswordError)
async def weak_password_handler(
    _request: Request, exc: WeakPasswordError
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"detail": exc.reasons},
    )


@app.exception_handler(IncorrectCurrentPasswordError)
async def incorrect_current_password_handler(
    _request: Request, _exc: IncorrectCurrentPasswordError
) -> JSONResponse:
    return JSONResponse(
        status_code=401,
        content={"detail": "Current password is incorrect"},
    )


@app.exception_handler(FolderNotFoundError)
async def folder_not_found_handler(
    _request: Request, _exc: FolderNotFoundError
) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={"detail": "Folder not found"},
    )


@app.exception_handler(FolderNameTakenError)
async def folder_name_taken_handler(
    _request: Request, _exc: FolderNameTakenError
) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={"detail": "A folder with this name already exists"},
    )


@app.exception_handler(ArticleNotFoundError)
async def article_not_found_handler(
    _request: Request, _exc: ArticleNotFoundError
) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={"detail": "Article not found"},
    )


@app.on_event("startup")
def validate_auth_config() -> None:
    if not config.JWT_SECRET_KEY:
        raise RuntimeError(
            "JWT_SECRET_KEY is not set. Add it to .env (see .env.example)."
        )
    log.info("md_editor API started")


@app.on_event("shutdown")
async def dispose_async_engine() -> None:
    await async_engine.dispose()


@app.get("/test")
async def test():
    """Smoke test: API up and database reachable."""
    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="database unavailable",
        ) from exc
    return {"status": "ok", "database": "connected"}
