from fastapi import APIRouter

from app.services.data_store import overview

router = APIRouter()


@router.get("")
def get_overview() -> dict:
    return overview()
