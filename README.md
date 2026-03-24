# 伊朗局势跟踪（可运行最小原型）

这是一个按“原油图谱 + 每日简报 + 海峡跟踪 + 实时更新”结构搭建的中文专题站原型，适合继续替换为真实行情、新闻和航运数据源。当前版本已接入 Yahoo Finance 公共行情接口作为默认实时行情源；若拉取失败，会自动回退到本地示例数据。

## 已完成内容

- 前端四个页面：`/`、`/briefing`、`/tracking`、`/live`
- FastAPI 后端接口：
  - `GET /api/overview`
  - `GET /api/markets/latest`
  - `GET /api/briefing/today`
  - `GET /api/tracking/status`
  - `GET /api/live/latest`
  - `GET /api/live/stream`（SSE）
- JSON 数据层：`data/static/*.json` 与 `data/generated/*.json`
- 模拟刷新脚本：`python scripts/generate_mock_update.py`
- 真实行情脚本：`python scripts/fetch_live_markets.py`

## 本地启动

### 后端
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 前端
```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000 npm run dev
```

浏览器打开：`http://127.0.0.1:3000`

## 模拟实时刷新

```bash
python scripts/generate_mock_update.py
```

每运行一次会：
- 随机更新行情数值与走势图历史
- 在实时流顶部插入一条新消息
- 同步刷新首页 KPI 的更新时间与数值

## 真实行情

后端 `GET /api/markets/latest` 现已支持：
- 默认优先拉取 Yahoo Finance 公共行情接口
- 拉取失败时自动回退到 `data/generated/markets.json`
- 加 `?refresh=true` 可强制刷新一次

可选环境变量：

```bash
MARKET_SOURCE=yahoo
MARKET_CACHE_TTL_SECONDS=60
MARKET_HTTP_TIMEOUT=8
```

若你想先关闭真实行情、只使用本地示例数据，可把 `MARKET_SOURCE=file`。

手动刷新真实行情：

```bash
python scripts/fetch_live_markets.py
```

## 风险提示

本项目示例内容仅做内部参考，不构成任何投资建议；数据由外部数据源与模型整理，不确保准确、及时。
