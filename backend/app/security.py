import hashlib
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

from app.config import settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def password_fingerprint(password_hash: str) -> str:
    """Токенді ағымдағы парольге байлау үшін. Хэштің өзін ашпайды."""
    return hashlib.sha256(password_hash.encode()).hexdigest()[:16]


def hash_code(code: str) -> str:
    """Сброс кодын БД-да ашық сақтамау үшін."""
    return hashlib.sha256(code.encode()).hexdigest()


def create_token(subject: str, ttl: timedelta, **claims: Any) -> str:
    now = datetime.now(UTC)
    payload = {"sub": subject, "iat": now, "exp": now + ttl, **claims}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any] | None:
    """Токен жарамсыз немесе мерзімі өтсе — None."""
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
