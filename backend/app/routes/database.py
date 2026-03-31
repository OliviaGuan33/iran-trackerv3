from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.services.auth import resolve_user_from_request
from app.services.workbook_store import (
    database_chart,
    database_charts,
    database_indicators,
    database_overview,
)

router = APIRouter(dependencies=[Depends(resolve_user_from_request)])


@router.get("/overview")
def overview() -> dict:
    return database_overview()


@router.get("/indicators")
def indicators(
    industry: str | None = Query(default=None),
    query: str | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
) -> dict:
    return database_indicators(industry=industry, query=query, limit=limit)


@router.get("/charts")
def charts(
    sheet: str | None = Query(default=None),
    query: str | None = Query(default=None),
    point_limit: int = Query(default=160, ge=20, le=5000),
) -> dict:
    return database_charts(sheet=sheet, query=query, point_limit=point_limit)


@router.get("/charts/{chart_id}")
def chart_detail(
    chart_id: str,
    point_limit: int | None = Query(default=None, ge=20, le=5000),
) -> dict:
    try:
        return database_chart(chart_id=chart_id, point_limit=point_limit)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="图表不存在。") from exc
