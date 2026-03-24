from __future__ import annotations

import asyncio
import json
from datetime import datetime

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.services.data_store import live, markets

router = APIRouter()


@router.get("/latest")
def latest_live() -> dict:
    return live()


@router.get("/stream")
async def stream_live() -> StreamingResponse:
    async def event_generator():
        while True:
            payload = {
                "ts": datetime.utcnow().isoformat(),
                "live": live().get("items", []),
                "markets": markets().get("items", []),
            }
            yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
            await asyncio.sleep(10)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
