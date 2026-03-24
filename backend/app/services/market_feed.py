from __future__ import annotations

import json
import os
import threading
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote

import httpx

ROOT = Path(__file__).resolve().parents[3]
GENERATED_DIR = ROOT / "data" / "generated"
MARKETS_FILE = GENERATED_DIR / "markets.json"
YAHOO_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

@dataclass(frozen=True)
class MarketConfig:
    label: str
    yahoo_symbol: str
    range: str = "1d"
    interval: str = "5m"
    precision: int = 2

MARKET_CONFIGS: list[MarketConfig] = [
    MarketConfig(label="Brent", yahoo_symbol="BZ=F", precision=2),
    MarketConfig(label="WTI", yahoo_symbol="CL=F", precision=2),
    MarketConfig(label="Gold", yahoo_symbol="GC=F", precision=2),
    MarketConfig(label="DXY", yahoo_symbol="DX-Y.NYB", precision=3),
]

_LOCK = threading.Lock()
_CACHE: dict[str, Any] = {"expires_at": None, "payload": None}


def _load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def _last_non_null(values: list[Any]) -> float | None:
    for value in reversed(values):
        if value is None:
            continue
        try:
            return float(value)
        except (TypeError, ValueError):
            continue
    return None


def _compact_history(values: list[Any], precision: int) -> list[float]:
    clean: list[float] = []
    for value in values:
        if value is None:
            continue
        try:
            clean.append(round(float(value), precision))
        except (TypeError, ValueError):
            continue
    if not clean:
        return []
    if len(clean) <= 12:
        return clean
    step = max(len(clean) // 12, 1)
    compact = clean[::step]
    if compact[-1] != clean[-1]:
        compact.append(clean[-1])
    return compact[-12:]


def _format_local_time(ts: int | None) -> str:
    if ts is None:
        return datetime.now().strftime("%Y-%m-%d %H:%M")
    dt = datetime.fromtimestamp(ts, tz=timezone.utc).astimezone()
    return dt.strftime("%Y-%m-%d %H:%M")


def _fetch_one(client: httpx.Client, config: MarketConfig) -> dict[str, Any]:
    url = YAHOO_URL.format(symbol=quote(config.yahoo_symbol, safe=""))
    response = client.get(
        url,
        params={
            "interval": config.interval,
            "range": config.range,
            "includePrePost": "true",
            "events": "div,splits",
        },
        headers={"User-Agent": USER_AGENT},
    )
    response.raise_for_status()
    payload = response.json()

    result = (((payload.get("chart") or {}).get("result") or [None])[0]) or {}
    meta = result.get("meta") or {}
    indicators = (result.get("indicators") or {}).get("quote") or []
    closes = ((indicators[0] if indicators else {}) or {}).get("close") or []

    price = _last_non_null(closes)
    previous = meta.get("chartPreviousClose") or meta.get("previousClose")
    if price is None:
        raise ValueError(f"{config.label} 未拿到有效价格")
    previous_price = float(previous) if previous not in (None, 0) else price
    pct_change = 0.0 if previous_price == 0 else ((price - previous_price) / previous_price) * 100

    return {
        "symbol": config.label,
        "price": round(price, config.precision),
        "pct_change": round(pct_change, 2),
        "history": _compact_history(closes, config.precision),
        "source_symbol": config.yahoo_symbol,
        "market_state": meta.get("marketState", "UNKNOWN"),
        "currency": meta.get("currency", ""),
        "updated_at": _format_local_time(meta.get("regularMarketTime") or meta.get("currentTradingPeriod", {}).get("regular", {}).get("end")),
    }


def _fallback_payload() -> dict[str, Any]:
    data = _load_json(MARKETS_FILE, {"updated_at": "", "items": []})
    if not isinstance(data, dict):
        return {"updated_at": "", "items": [], "source": "fallback", "is_live": False}
    data.setdefault("source", "fallback")
    data.setdefault("is_live", False)
    return data


def refresh_live_markets(force: bool = False) -> dict[str, Any]:
    source = os.getenv("MARKET_SOURCE", "yahoo").strip().lower()
    ttl_seconds = int(os.getenv("MARKET_CACHE_TTL_SECONDS", "60"))
    timeout = float(os.getenv("MARKET_HTTP_TIMEOUT", "8"))

    if source not in {"yahoo", "file"}:
        source = "yahoo"
    if source == "file":
        return _fallback_payload()

    now = datetime.now(timezone.utc)
    with _LOCK:
        expires_at = _CACHE.get("expires_at")
        cached_payload = _CACHE.get("payload")
        if not force and cached_payload and isinstance(expires_at, datetime) and now < expires_at:
            return cached_payload
        try:
            with httpx.Client(timeout=timeout, follow_redirects=True) as client:
                items = [_fetch_one(client, config) for config in MARKET_CONFIGS]
            updated_at = max((item.get("updated_at", "") for item in items), default=datetime.now().strftime("%Y-%m-%d %H:%M"))
            payload = {
                "updated_at": updated_at,
                "source": "yahoo_finance",
                "is_live": True,
                "items": items,
            }
            _save_json(MARKETS_FILE, payload)
            _CACHE["payload"] = payload
            _CACHE["expires_at"] = now + timedelta(seconds=ttl_seconds)
            return payload
        except Exception as exc:
            fallback = _fallback_payload()
            fallback["error"] = str(exc)
            _CACHE["payload"] = fallback
            _CACHE["expires_at"] = now + timedelta(seconds=min(ttl_seconds, 30))
            return fallback
