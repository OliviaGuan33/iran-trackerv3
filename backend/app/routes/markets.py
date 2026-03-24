from fastapi import APIRouter, Query

from app.services.market_feed import refresh_live_markets

router = APIRouter()


@router.get("/latest")
def latest_markets(refresh: bool = Query(default=False)) -> dict:
    return refresh_live_markets(force=refresh)
