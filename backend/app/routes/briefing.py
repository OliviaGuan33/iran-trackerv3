from fastapi import APIRouter

from app.services.data_store import briefing

router = APIRouter()


@router.get("/today")
def today_briefing() -> dict:
    return briefing()
