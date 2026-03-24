from fastapi import APIRouter

from app.services.data_store import tracking

router = APIRouter()


@router.get("/status")
def tracking_status() -> dict:
    return tracking()
