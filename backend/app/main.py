from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import briefing, live, markets, overview, tracking

app = FastAPI(title="Iran Tracker API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
