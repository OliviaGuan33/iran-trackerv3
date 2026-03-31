from __future__ import annotations

import json
from pathlib import Path

from backend.app.services.workbook_store import _build_snapshot


def main() -> None:
    snapshot = _build_snapshot()
    output_path = Path(__file__).resolve().parents[1] / "data" / "generated" / "workbook_snapshot.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(snapshot, ensure_ascii=False), encoding="utf-8")
    print(output_path)


if __name__ == "__main__":
    main()
