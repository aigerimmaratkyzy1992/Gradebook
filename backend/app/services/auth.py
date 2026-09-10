import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import PasswordResetCode, User
from app.roles import Role, STUDENT
from app.security import (
    create_token,
    decode_token,
    hash_code,
    hash_password,
    password_fingerprint,
    verify_password,
)


class EmailAlreadyUsed(Exception):
    """Мұндай пошта тіркелген."""


class InvalidResetCode(Exception):
    """Сброс коды қате, мерзімі өткен немесе бұрын қолданылған."""


class TooManyAttempts(Exception):
    """Код тым көп рет қате енгізілді."""


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    return await db.scalar(select(User).where(User.email == email))


async def register(
    db: AsyncSession,
    email: str,
    password: str,
    role: Role = STUDENT,
    full_name: str | None = None,
) -> User:
    if await get_by_email(db, email):
        raise EmailAlreadyUsed

    user = User(
        email=email,
        password_hash=hash_password(password),
        role=role,
        full_name=full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> User | None:
    user = await get_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user


def create_access_token(user: User) -> str:
    """Токен ағымдағы паролге байлаулы: пароль ауысса, сессиялар жабылады."""
    return create_token(
        str(user.id),
        timedelta(minutes=settings.access_token_ttl_minutes),
        ph=password_fingerprint(user.password_hash),
    )


async def create_reset_code(db: AsyncSession, user: User) -> str:
    """Жаңа код жасайды; пайдаланушының ескі кодтары бірден жарамсыз болады."""
    now = datetime.now(UTC)
    await db.execute(
        update(PasswordResetCode)
        .where(
            PasswordResetCode.user_id == user.id,
            PasswordResetCode.used_at.is_(None),
        )
        .values(used_at=now)
    )

    code = f"{secrets.randbelow(1_000_000):06d}"
    db.add(
        PasswordResetCode(
            user_id=user.id,
            code_hash=hash_code(code),
            expires_at=now + timedelta(minutes=settings.reset_code_ttl_minutes),
        )
    )
    await db.commit()
    return code


async def get_by_access_token(db: AsyncSession, token: str) -> User | None:
    payload = decode_token(token)
    if payload is None:
        return None

    user = await db.get(User, int(payload["sub"]))
    if user is None or payload.get("ph") != password_fingerprint(user.password_hash):
        return None
    return user


async def reset_password(
    db: AsyncSession, email: str, code: str, password: str
) -> None:
    user = await get_by_email(db, email)
    if user is None:
        raise InvalidResetCode

    entry = await db.scalar(
        select(PasswordResetCode)
        .where(
            PasswordResetCode.user_id == user.id,
            PasswordResetCode.used_at.is_(None),
        )
        .order_by(PasswordResetCode.id.desc())
        .limit(1)
    )
    if entry is None or entry.expires_at < datetime.now(UTC):
        raise InvalidResetCode
    if entry.attempts >= settings.reset_code_max_attempts:
        raise TooManyAttempts

    if entry.code_hash != hash_code(code):
        entry.attempts += 1
        await db.commit()
        raise InvalidResetCode

    entry.used_at = datetime.now(UTC)
    user.password_hash = hash_password(password)
    await db.commit()
