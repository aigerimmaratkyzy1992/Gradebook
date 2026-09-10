from collections.abc import Sequence

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.roles import ADMIN, Role
from app.security import hash_password, verify_password
from app.services.auth import EmailAlreadyUsed, get_by_email


async def list_users(db: AsyncSession, role: Role | None = None) -> Sequence[User]:
    query = select(User).order_by(User.id)
    if role is not None:
        query = query.where(User.role == role)
    return (await db.scalars(query)).all()


async def update_user(
    db: AsyncSession, user_id: int, changes: dict[str, object]
) -> User | None:
    user = await db.get(User, user_id)
    if user is None:
        return None

    email = changes.get("email")
    if email is not None and email != user.email:
        if await get_by_email(db, str(email)):
            raise EmailAlreadyUsed
        user.email = str(email)

    if "full_name" in changes:
        name = str(changes["full_name"] or "").strip()
        user.full_name = name or None

    if changes.get("role") is not None:
        user.role = str(changes["role"])

    password = changes.get("password")
    if password:
        user.password_hash = hash_password(str(password))

    await db.commit()
    await db.refresh(user)
    return user


class WrongPassword(Exception):
    """Ағымдағы пароль дұрыс емес."""


async def change_password(
    db: AsyncSession, user: User, current: str, new: str
) -> User:
    """Пайдаланушының өз паролін ауыстырады."""
    if not verify_password(current, user.password_hash):
        raise WrongPassword

    user.password_hash = hash_password(new)
    await db.commit()
    await db.refresh(user)
    return user


async def delete_user(db: AsyncSession, user_id: int) -> bool:
    user = await db.get(User, user_id)
    if user is None:
        return False

    await db.delete(user)
    await db.commit()
    return True


async def ensure_admins(db: AsyncSession, emails: Sequence[str]) -> None:
    """Қосымша іске қосылғанда .env-тегі пошталарға admin рөлін береді."""
    if not emails:
        return

    await db.execute(
        update(User).where(User.email.in_(emails), User.role != ADMIN).values(role=ADMIN)
    )
    await db.commit()
