# ExceltoWeb

ExceltoWeb turns Excel workbook content into a web dashboard and authenticated API.

## What it does

- Parses indicator summaries and chart blocks from the Excel workbook
- Shows the parsed charts in the Next.js frontend
- Supports user registration and login
- Protects data APIs with both `Bearer Token` and `Basic Auth`
- Falls back to the committed workbook snapshot when the original local Excel file is not available in cloud environments
- Supports persistent user storage through `DATABASE_URL` so it can run on Render Postgres

## Main APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/database/overview`
- `GET /api/database/indicators`
- `GET /api/database/charts`
- `GET /api/database/charts/{chart_id}`

## Local run

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
set NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
npm run dev
```

Open `http://127.0.0.1:3000`.

## Refresh the workbook snapshot

When the source Excel file changes, regenerate the cloud snapshot:

```bash
python scripts/export_workbook_snapshot.py
```

This updates `data/generated/workbook_snapshot.json`.

## Cloud deployment

- Render web service name: `exceltoweb-api`
- Render Postgres name: `exceltoweb-db`
- Vercel frontend project name: `exceltoweb-web`
- FastAPI title: `ExceltoWeb API`
- Frontend title: `ExceltoWeb`
