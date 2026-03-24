from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.market_feed import refresh_live_markets  # noqa: E402

if __name__ == "__main__":
    payload = refresh_live_markets(force=True)
    print(json.dumps(payload, ensure_ascii=False, indent=2))
