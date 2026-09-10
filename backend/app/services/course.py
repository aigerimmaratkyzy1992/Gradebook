from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Assignment,
    AssignmentFile,
    Course,
    Group,
    Topic,
    User,
    course_groups,
)
from app.models.group import group_members
from app.roles import ADMIN, STUDENT, TEACHER


class TeacherNotFound(Exception):
    """Тағайындалған пайдаланушы жоқ немесе преподаватель емес."""


async def _resolve_groups(db: AsyncSession, group_ids: Sequence[int]) -> list[Group]:
    if not group_ids:
        return []
    return list((await db.scalars(select(Group).where(Group.id.in_(group_ids)))).all())


async def _check_teacher(db: AsyncSession, teacher_id: int | None) -> None:
    if teacher_id is None:
        return

    teacher = await db.get(User, teacher_id)
    if teacher is None or teacher.role not in (TEACHER, ADMIN):
        raise TeacherNotFound


async def list_courses(db: AsyncSession, viewer: User) -> Sequence[Course]:
    """Admin — бәрін, преподаватель — өзінікін, студент — өз топтарындағысын."""
    query = select(Course).order_by(Course.id)

    if viewer.role == TEACHER:
        query = query.where(Course.teacher_id == viewer.id)
    elif viewer.role == STUDENT:
        query = (
            query.join(course_groups, course_groups.c.course_id == Course.id)
            .join(group_members, group_members.c.group_id == course_groups.c.group_id)
            .where(group_members.c.student_id == viewer.id)
            .distinct()
        )

    return (await db.scalars(query)).all()


async def get_course(db: AsyncSession, course_id: int) -> Course | None:
    return await db.get(Course, course_id)


async def can_view(db: AsyncSession, course: Course, viewer: User) -> bool:
    if viewer.role == ADMIN or course.teacher_id == viewer.id:
        return True

    student_group_ids = set(
        (
            await db.scalars(
                select(group_members.c.group_id).where(
                    group_members.c.student_id == viewer.id
                )
            )
        ).all()
    )
    return any(group.id in student_group_ids for group in course.groups)


async def create_course(
    db: AsyncSession,
    name: str,
    description: str | None,
    teacher_id: int | None,
    group_ids: Sequence[int],
) -> Course:
    await _check_teacher(db, teacher_id)

    course = Course(name=name, description=description, teacher_id=teacher_id)
    course.groups = await _resolve_groups(db, group_ids)
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


async def update_course(
    db: AsyncSession, course: Course, changes: dict[str, object]
) -> Course:
    if "teacher_id" in changes:
        await _check_teacher(db, changes["teacher_id"])  # type: ignore[arg-type]
        course.teacher_id = changes["teacher_id"]  # type: ignore[assignment]
    if changes.get("name") is not None:
        course.name = str(changes["name"])
    if "description" in changes:
        course.description = changes["description"]  # type: ignore[assignment]
    if changes.get("group_ids") is not None:
        course.groups = await _resolve_groups(db, changes["group_ids"])  # type: ignore[arg-type]

    await db.commit()
    await db.refresh(course)
    return course


async def delete_course(db: AsyncSession, course: Course) -> None:
    await db.delete(course)
    await db.commit()


async def create_topic(db: AsyncSession, course: Course, title: str) -> Topic:
    position = max((topic.position for topic in course.topics), default=0) + 1
    topic = Topic(course_id=course.id, title=title, position=position)
    db.add(topic)
    await db.commit()
    await db.refresh(topic)
    return topic


async def get_topic(db: AsyncSession, topic_id: int) -> Topic | None:
    return await db.get(Topic, topic_id)


async def update_topic(
    db: AsyncSession, topic: Topic, changes: dict[str, object]
) -> Topic:
    if changes.get("title") is not None:
        topic.title = str(changes["title"])
    if changes.get("position") is not None:
        topic.position = int(changes["position"])  # type: ignore[arg-type]

    await db.commit()
    await db.refresh(topic)
    return topic


async def delete_topic(db: AsyncSession, topic: Topic) -> None:
    await db.delete(topic)
    await db.commit()


async def create_assignment(
    db: AsyncSession, topic: Topic, data: dict[str, object]
) -> Assignment:
    assignment = Assignment(topic_id=topic.id, **data)
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment


async def get_assignment(db: AsyncSession, assignment_id: int) -> Assignment | None:
    return await db.get(Assignment, assignment_id)


async def update_assignment(
    db: AsyncSession, assignment: Assignment, changes: dict[str, object]
) -> Assignment:
    for field, value in changes.items():
        setattr(assignment, field, value)

    await db.commit()
    await db.refresh(assignment)
    return assignment


async def delete_assignment(db: AsyncSession, assignment: Assignment) -> None:
    await db.delete(assignment)
    await db.commit()


async def add_files(
    db: AsyncSession, assignment: Assignment, files: Sequence[tuple[str, str, int]]
) -> Assignment:
    """Тапсырмаға тіркелген файлдарды жазады."""
    # id-ді алдын ала аламыз: expire() кейін объектіден оқу sync жүктеуге әкеледі.
    assignment_id = assignment.id
    for filename, stored_name, size in files:
        db.add(
            AssignmentFile(
                assignment_id=assignment.id,
                filename=filename,
                stored_name=stored_name,
                size=size,
            )
        )
    await db.commit()
    db.expire(assignment)
    return await db.scalar(  # type: ignore[return-value]
        select(Assignment).where(Assignment.id == assignment_id)
    )


async def get_file(db: AsyncSession, file_id: int) -> AssignmentFile | None:
    return await db.get(AssignmentFile, file_id)


async def delete_file(db: AsyncSession, record: AssignmentFile) -> None:
    await db.delete(record)
    await db.commit()
