from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = ROOT / "data"
GENERATED_DIR = DATA_DIR / "generated"
STATIC_DIR = DATA_DIR / "static"


def _load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def overview() -> dict[str, Any]:
    data = _load_json(STATIC_DIR / "overview.json", {})
    return data if isinstance(data, dict) else {}


def markets() -> dict[str, Any]:
    data = _load_json(GENERATED_DIR / "markets.json", {"updated_at": "", "items": []})
    return data if isinstance(data, dict) else {"updated_at": "", "items": []}


def briefing() -> dict[str, Any]:
    data = _load_json(GENERATED_DIR / "briefing.json", {})
    return data if isinstance(data, dict) else {}


def tracking() -> dict[str, Any]:
    data = _load_json(GENERATED_DIR / "tracking.json", {})
    return data if isinstance(data, dict) else {}


def live() -> dict[str, Any]:
    data = _load_json(GENERATED_DIR / "live.json", {"items": []})
    return data if isinstance(data, dict) else {"items": []}
