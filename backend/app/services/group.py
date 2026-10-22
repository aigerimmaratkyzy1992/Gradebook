from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, undefer

from app.models import Group, User
from app.roles import ADMIN, STUDENT, TEACHER


class StudentNotFound(Exception):
    """Мұндай поштамен пайдаланушы тіркелмеген."""


class NotAStudent(Exception):
    """Топқа тек student рөліндегілер қосылады."""


class AlreadyInGroup(Exception):
    """Студент бұл топта бар."""


class TeacherNotFound(Exception):
    """Тағайындалған пайдаланушы жоқ немесе преподаватель емес."""


async def list_groups(db: AsyncSession, viewer: User) -> Sequence[Group]:
    """Admin барлық топты, преподаватель өзінің топтарын көреді.

    Студенттер жүктелмейді: students_count бір подсұраныспен келеді."""
    query = select(Group).options(undefer(Group.students_count)).order_by(Group.id)
    if viewer.role != ADMIN:
        query = query.where(Group.teacher_id == viewer.id)
    return (await db.scalars(query)).all()


async def get_group(db: AsyncSession, group_id: int) -> Group | None:
    """Студенттерімен және санымен. populate_existing әрқашан жаңа күйді береді."""
    return await db.scalar(
        select(Group)
        .where(Group.id == group_id)
        .options(undefer(Group.students_count), selectinload(Group.students))
        .execution_options(populate_existing=True)
    )


async def _check_teacher(db: AsyncSession, teacher_id: int | None) -> None:
    if teacher_id is None:
        return

    teacher = await db.get(User, teacher_id)
    if teacher is None or teacher.role not in (TEACHER, ADMIN):
        raise TeacherNotFound


async def create_group(
    db: AsyncSession, name: str, teacher_id: int | None
) -> Group:
    await _check_teacher(db, teacher_id)

    group = Group(name=name, teacher_id=teacher_id)
    db.add(group)
    await db.commit()
    return await get_group(db, group.id)  # type: ignore[return-value]


async def update_group(
    db: AsyncSession, group: Group, name: str | None, teacher_id: int | None
) -> Group:
    if name is not None:
        group.name = name
    if teacher_id != group.teacher_id:
        await _check_teacher(db, teacher_id)
        group.teacher_id = teacher_id

    group_id = group.id
    await db.commit()
    return await get_group(db, group_id)  # type: ignore[return-value]


async def delete_group(db: AsyncSession, group: Group) -> None:
    await db.delete(group)
    await db.commit()


async def add_student(db: AsyncSession, group: Group, email: str) -> Group:
    student = await db.scalar(select(User).where(User.email == email))
    if student is None:
        raise StudentNotFound
    if student.role != STUDENT:
        raise NotAStudent
    if any(existing.id == student.id for existing in group.students):
        raise AlreadyInGroup

    group_id = group.id
    group.students.append(student)
    await db.commit()
    return await get_group(db, group_id)  # type: ignore[return-value]


async def remove_student(
    db: AsyncSession, group: Group, student_id: int
) -> Group | None:
    """Студент топта болмаса — None, әйтпесе жаңартылған топ."""
    student = next((s for s in group.students if s.id == student_id), None)
    if student is None:
        return None

    group_id = group.id
    group.students.remove(student)
    await db.commit()
    return await get_group(db, group_id)
