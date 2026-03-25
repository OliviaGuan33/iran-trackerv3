import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import briefing, live, markets, overview, tracking


def _cors_settings() -> tuple[list[str], bool]:
    raw = os.getenv("CORS_ALLOW_ORIGINS", "*").strip()
    if not raw or raw == "*":
        return ["*"], False

    origins = [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]
    if not origins:
        return ["*"], False

    return origins, True


cors_origins, allow_credentials = _cors_settings()

app = FastAPI(title="Iran Tracker API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(overview.router, prefix="/api/overview", tags=["overview"])
app.include_router(markets.router, prefix="/api/markets", tags=["markets"])
app.include_router(briefing.router, prefix="/api/briefing", tags=["briefing"])
app.include_router(tracking.router, prefix="/api/tracking", tags=["tracking"])
app.include_router(live.router, prefix="/api/live", tags=["live"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
