#!/usr/bin/env bash
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
echo "[1/3] backend deps"
python3 -m venv "$ROOT/backend/.venv"
source "$ROOT/backend/.venv/bin/activate"
pip install -r "$ROOT/backend/requirements.txt"
echo "[2/3] frontend deps"
cd "$ROOT/frontend"
npm install
echo "[3/3] run"
printf '
Backend: cd %s/backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000
' "$ROOT"
printf 'Frontend: cd %s/frontend && NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000 npm run dev

' "$ROOT"
