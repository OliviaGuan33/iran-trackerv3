from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import tempfile
import urllib.error
import urllib.request
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from fastapi import HTTPException, Request, status

ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = ROOT / "data" / "generated"
DEFAULT_TOKEN_TTL_HOURS = 24


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _auth_secret() -> bytes:
    secret = os.getenv("API_AUTH_SECRET", "change-this-secret-before-production").strip()
    return secret.encode("utf-8")


def _database_url() -> str:
    return os.getenv("DATABASE_URL", "").strip()


def _gist_token() -> str:
    return os.getenv("GITHUB_GIST_AUTH_TOKEN", "").strip()


def _gist_id() -> str:
    return os.getenv("GITHUB_GIST_AUTH_ID", "").strip()


def _gist_filename() -> str:
    return os.getenv("GITHUB_GIST_AUTH_FILENAME", "users.json").strip() or "users.json"


def _using_gist() -> bool:
    return bool(_gist_token() and _gist_id())


def _using_postgres() -> bool:
    url = _database_url().lower()
    return url.startswith("postgres://") or url.startswith("postgresql://")


def _users_db_path() -> Path:
    configured = os.getenv("USERS_DB_PATH", "").strip()
    if configured:
        return Path(configured)

    if os.getenv("VERCEL") == "1":
        return Path(tempfile.gettempdir()) / "exceltoweb-users.sqlite3"

    return DATA_DIR / "users.sqlite3"


def _connect_sqlite() -> sqlite3.Connection:
    db_path = _users_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    return connection


def _connect_postgres():
    from psycopg import connect
    from psycopg.rows import dict_row

    return connect(_database_url(), row_factory=dict_row)


def _gist_request(method: str, path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    url = f"https://api.github.com{path}"
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=data, method=method)
    request.add_header("Authorization", f"Bearer {_gist_token()}")
    request.add_header("Accept", "application/vnd.github+json")
    request.add_header("X-GitHub-Api-Version", "2022-11-28")
    request.add_header("User-Agent", "ExceltoWeb")
    if data is not None:
        request.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise HTTPException(status_code=500, detail=f"Gist storage error: {detail or exc.reason}") from exc


def _gist_load_users() -> dict[str, Any]:
    gist = _gist_request("GET", f"/gists/{_gist_id()}")
    file_info = (gist.get("files") or {}).get(_gist_filename()) or {}
    content = file_info.get("content") or "{}"
    data = json.loads(content)
    return data if isinstance(data, dict) else {}


def _gist_save_users(users: dict[str, Any]) -> None:
    _gist_request(
        "PATCH",
        f"/gists/{_gist_id()}",
        {
            "files": {
                _gist_filename(): {
                    "content": json.dumps(users, ensure_ascii=False, separators=(",", ":")),
                }
            }
        },
    )


def _normalize_username(username: str) -> str:
    normalized = username.strip()
    if len(normalized) < 3 or len(normalized) > 64:
        raise HTTPException(status_code=400, detail="Username must be between 3 and 64 characters.")
    return normalized


def _validate_password(password: str) -> None:
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")


def _hash_password(password: str, salt: str) -> str:
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        600_000,
    )
    return digest.hex()


def _serialize_created_at(value: Any) -> str:
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def init_auth_storage() -> None:
    if _using_gist():
        _gist_load_users()
        return

    if _using_postgres():
        with _connect_postgres() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS users (
                        id BIGSERIAL PRIMARY KEY,
                        username TEXT NOT NULL UNIQUE,
                        password_hash TEXT NOT NULL,
                        salt TEXT NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL
                    )
                    """
                )
        return

    with _connect_sqlite() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def _encode_token(payload: dict[str, Any]) -> str:
    body = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    payload_part = base64.urlsafe_b64encode(body).rstrip(b"=")
    signature = hmac.new(_auth_secret(), payload_part, hashlib.sha256).digest()
    signature_part = base64.urlsafe_b64encode(signature).rstrip(b"=")
    return f"{payload_part.decode('ascii')}.{signature_part.decode('ascii')}"


def _decode_token(token: str) -> dict[str, Any]:
    try:
        payload_part, signature_part = token.split(".", 1)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid access token.") from exc

    expected = hmac.new(_auth_secret(), payload_part.encode("ascii"), hashlib.sha256).digest()
    actual = base64.urlsafe_b64decode(signature_part + "=" * (-len(signature_part) % 4))
    if not hmac.compare_digest(expected, actual):
        raise HTTPException(status_code=401, detail="Token signature verification failed.")

    raw = base64.urlsafe_b64decode(payload_part + "=" * (-len(payload_part) % 4))
    payload = json.loads(raw.decode("utf-8"))
    exp = payload.get("exp")
    if not isinstance(exp, str) or _utcnow() >= datetime.fromisoformat(exp):
        raise HTTPException(status_code=401, detail="Access token expired. Please log in again.")
    return payload


def register_user(username: str, password: str) -> dict[str, Any]:
    init_auth_storage()
    normalized = _normalize_username(username)
    _validate_password(password)
    salt = secrets.token_hex(16)
    password_hash = _hash_password(password, salt)
    created_at = _utcnow()

    if _using_gist():
        users = _gist_load_users()
        if normalized in users:
            raise HTTPException(status_code=409, detail="Username already exists.")
        users[normalized] = {
            "username": normalized,
            "password_hash": password_hash,
            "salt": salt,
            "created_at": created_at.isoformat(),
        }
        _gist_save_users(users)
        return {"username": normalized, "created_at": created_at.isoformat()}

    if _using_postgres():
        from psycopg import IntegrityError

        try:
            with _connect_postgres() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO users (username, password_hash, salt, created_at)
                        VALUES (%s, %s, %s, %s)
                        RETURNING username, created_at
                        """,
                        (normalized, password_hash, salt, created_at),
                    )
                    row = cur.fetchone()
        except IntegrityError as exc:
            if getattr(exc, "sqlstate", None) == "23505":
                raise HTTPException(status_code=409, detail="Username already exists.") from exc
            raise

        if not row:
            raise HTTPException(status_code=500, detail="Failed to create user.")
        return {"username": row["username"], "created_at": _serialize_created_at(row["created_at"])}

    try:
        with _connect_sqlite() as conn:
            conn.execute(
                "INSERT INTO users (username, password_hash, salt, created_at) VALUES (?, ?, ?, ?)",
                (normalized, password_hash, salt, created_at.isoformat()),
            )
            conn.commit()
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Username already exists.") from exc

    return {"username": normalized, "created_at": created_at.isoformat()}


def authenticate_user(username: str, password: str) -> dict[str, Any]:
    normalized = _normalize_username(username)
    _validate_password(password)

    if _using_gist():
        row = (_gist_load_users()).get(normalized)
    elif _using_postgres():
        with _connect_postgres() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT username, password_hash, salt, created_at FROM users WHERE username = %s",
                    (normalized,),
                )
                row = cur.fetchone()
    else:
        with _connect_sqlite() as conn:
            row = conn.execute(
                "SELECT username, password_hash, salt, created_at FROM users WHERE username = ?",
                (normalized,),
            ).fetchone()

    if row is None:
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    if not hmac.compare_digest(row["password_hash"], _hash_password(password, row["salt"])):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    return {
        "username": row["username"],
        "created_at": _serialize_created_at(row["created_at"]),
    }


def create_access_token(username: str, ttl_hours: int = DEFAULT_TOKEN_TTL_HOURS) -> str:
    expires_at = (_utcnow() + timedelta(hours=ttl_hours)).isoformat()
    payload = {"sub": username, "exp": expires_at}
    return _encode_token(payload)


def verify_access_token(token: str) -> dict[str, Any]:
    payload = _decode_token(token)
    username = payload.get("sub")
    if not isinstance(username, str) or not username:
        raise HTTPException(status_code=401, detail="Invalid access token.")

    if _using_gist():
        row = (_gist_load_users()).get(username)
    elif _using_postgres():
        with _connect_postgres() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT username, created_at FROM users WHERE username = %s",
                    (username,),
                )
                row = cur.fetchone()
    else:
        with _connect_sqlite() as conn:
            row = conn.execute(
                "SELECT username, created_at FROM users WHERE username = ?",
                (username,),
            ).fetchone()

    if row is None:
        raise HTTPException(status_code=401, detail="User does not exist.")

    return {"username": row["username"], "created_at": _serialize_created_at(row["created_at"])}


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required.",
        headers={"WWW-Authenticate": 'Bearer realm="api", Basic realm="api"'},
    )


def resolve_user_from_request(request: Request) -> dict[str, Any]:
    header = request.headers.get("Authorization", "").strip()
    if not header:
        raise _unauthorized()

    scheme, _, value = header.partition(" ")
    if not value:
        raise _unauthorized()

    if scheme.lower() == "bearer":
        return verify_access_token(value.strip())

    if scheme.lower() == "basic":
        try:
            decoded = base64.b64decode(value.strip()).decode("utf-8")
            username, password = decoded.split(":", 1)
        except Exception as exc:  # pragma: no cover
            raise _unauthorized() from exc
        return authenticate_user(username, password)

    raise _unauthorized()
