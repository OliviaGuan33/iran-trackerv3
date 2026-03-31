from __future__ import annotations

from pydantic import BaseModel, Field

from fastapi import APIRouter, Depends

from app.services.auth import (
    authenticate_user,
    create_access_token,
    register_user,
    resolve_user_from_request,
)

router = APIRouter()


class CredentialsPayload(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)


@router.post("/register")
def register(payload: CredentialsPayload) -> dict:
    user = register_user(payload.username, payload.password)
    token = create_access_token(user["username"])
    return {
        "user": user,
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/login")
def login(payload: CredentialsPayload) -> dict:
    user = authenticate_user(payload.username, payload.password)
    token = create_access_token(user["username"])
    return {
        "user": user,
        "access_token": token,
        "token_type": "bearer",
    }


@router.get("/me")
def me(user: dict = Depends(resolve_user_from_request)) -> dict:
    return {"user": user}
