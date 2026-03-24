from __future__ import annotations

import json
import random
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GEN = ROOT / "data" / "generated"
STATIC = ROOT / "data" / "static"
MARKET_PATH = GEN / "markets.json"
LIVE_PATH = GEN / "live.json"
OVERVIEW_PATH = STATIC / "overview.json"
LIVE_TEMPLATES = [
    ("市场", "Brent 波动扩大，资金继续交易短期风险溢价。"),
    ("航运", "更多船东倾向等待更清晰的通行窗口。"),
    ("外交", "新表态强调继续沟通，但缺少实质落地细节。"),
    ("海峡", "海峡周边风险提示保持高等级。"),
    ("原油", "替代管线分流能力有限，市场继续关注实际装船。")
]

def read_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)

def write_json(path: Path, data: dict) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def bump_market(price: float) -> float:
    delta = random.uniform(-0.35, 0.45)
    return round(price + delta, 2)

def main() -> None:
    ts = datetime.now().strftime("%Y-%m-%d %H:%M")
    markets = read_json(MARKET_PATH)
    for item in markets["items"]:
        item["price"] = bump_market(float(item["price"]))
        hist = item.get("history", [])
        hist.append(item["price"])
        item["history"] = hist[-7:]
        base = item["history"][0]
        if base:
            item["pct_change"] = round((item["price"] - base) / base * 100, 2)
    markets["updated_at"] = ts
    write_json(MARKET_PATH, markets)
    live = read_json(LIVE_PATH)
    tag, text = random.choice(LIVE_TEMPLATES)
    live["items"].insert(0, {"time": datetime.now().strftime("%H:%M"), "tag": tag, "text": text})
    live["items"] = live["items"][:10]
    live["updated_at"] = ts
    write_json(LIVE_PATH, live)
    overview = read_json(OVERVIEW_PATH)
    overview["updated_at"] = ts
    prices = {item["symbol"]: item for item in markets["items"]}
    mapping = {"黄金": "Gold", "DXY": "DXY", "Brent": "Brent", "WTI": "WTI"}
    for card in overview.get("kpis", []):
        symbol = mapping.get(card["label"], card["label"])
        if symbol in prices:
            card["value"] = str(prices[symbol]["price"])
            pct = float(prices[symbol]["pct_change"])
            card["change"] = f"{'+' if pct >= 0 else ''}{pct}%"
    write_json(OVERVIEW_PATH, overview)

if __name__ == "__main__":
    main()
