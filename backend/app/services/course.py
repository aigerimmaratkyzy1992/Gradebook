from collections.abc import Sequence
from dataclasses import dataclass

from sqlalchemy import Row, exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Assignment,
    AssignmentFile,
    Course,
    Group,
    Question,
    Test,
    Topic,
    User,
    course_groups,
)
from app.models.group import group_members
from app.roles import ADMIN, STUDENT, TEACHER


class TeacherNotFound(Exception):
    """Тағайындалған пайдаланушы жоқ немесе преподаватель емес."""


class GroupNotAvailable(Exception):
    """Топ жоқ немесе оны осы пайдаланушы дисциплинаға тағайындай алмайды."""


# Курстың толық ағашы (тақырыптар → тапсырмалар → файлдар, тестілер).
# Test.questions кіріспейді: CourseResponse-қа тек TestBrief керек.
_TREE = selectinload(Course.topics).options(
    selectinload(Topic.assignments), selectinload(Topic.tests)
)
# Өшіру үшін ORM каскады бүкіл ағашты жүктеуді талап етеді.
_DELETE_TREE = selectinload(Course.topics).options(
    selectinload(Topic.assignments),
    selectinload(Topic.tests)
    .selectinload(Test.questions)
    .selectinload(Question.options),
)
_TOPIC_TREE = (selectinload(Topic.assignments), selectinload(Topic.tests))
_TOPIC_DELETE_TREE = (
    selectinload(Topic.assignments),
    selectinload(Topic.tests)
    .selectinload(Test.questions)
    .selectinload(Question.options),
)


async def _resolve_groups(
    db: AsyncSession,
    group_ids: Sequence[int],
    viewer: User,
    keep_ids: Sequence[int] = (),
) -> list[Group]:
    """Топтарды табады. Admin — кез келгенін, преподаватель — тек өз топтарын
    (Group.teacher_id) тағайындай алады, әйтпесе құрамы (ростер) ашылып қалады.

    keep_ids — дисциплинада бұрыннан тұрған топтар: оларды өзгертпей қалдыруға болады.
    Жоқ немесе рұқсат етілмеген id болса — GroupNotAvailable (үнсіз тасталмайды)."""
    wanted = set(group_ids)
    if not wanted:
        return []

    query = select(Group).where(Group.id.in_(wanted))
    groups = list((await db.scalars(query)).all())

    if viewer.role != ADMIN:
        allowed = set(keep_ids)
        groups_ok = all(
            group.teacher_id == viewer.id or group.id in allowed for group in groups
        )
    else:
        groups_ok = True
    if len(groups) != len(wanted) or not groups_ok:
        raise GroupNotAvailable
    return groups


async def _check_teacher(db: AsyncSession, teacher_id: int | None) -> None:
    if teacher_id is None:
        return

    teacher = await db.get(User, teacher_id)
    if teacher is None or teacher.role not in (TEACHER, ADMIN):
        raise TeacherNotFound


def _visible(query, viewer: User):  # type: ignore[no-untyped-def]
    """Admin — бәрін, преподаватель — өзінікін, студент — өз топтарындағысын."""
    if viewer.role == TEACHER:
        query = query.where(Course.teacher_id == viewer.id)
    elif viewer.role == STUDENT:
        query = (
            query.join(course_groups, course_groups.c.course_id == Course.id)
            .join(group_members, group_members.c.group_id == course_groups.c.group_id)
            .where(group_members.c.student_id == viewer.id)
            .distinct()
        )
    return query


async def list_courses(db: AsyncSession, viewer: User) -> Sequence[Course]:
    """Тізімге тақырыптар ағашы жүктелмейді (CourseResponse-қа керек емес)."""
    query = _visible(select(Course).order_by(Course.id), viewer)
    return (await db.scalars(query)).all()


async def visible_course_names(db: AsyncSession, viewer: User) -> dict[int, str]:
    """Қолжетімді дисциплиналар: id → атауы (толық нысандарсыз)."""
    rows = await db.execute(
        _visible(select(Course.id, Course.name).order_by(Course.id), viewer)
    )
    return {course_id: name for course_id, name in rows.all()}


async def get_course(db: AsyncSession, course_id: int) -> Course | None:
    """Толық ағашпен. populate_existing: сессиядағы жартылай жүктелген нысанды жаңартады."""
    return await db.scalar(
        select(Course)
        .where(Course.id == course_id)
        .options(_TREE)
        .execution_options(populate_existing=True)
    )


async def get_course_shallow(db: AsyncSession, course_id: int) -> Course | None:
    """Тақырыптарсыз (topics жүктелмейді): өзгерту алдында ғана керек."""
    return await db.get(Course, course_id)


async def course_row(db: AsyncSession, course_id: int) -> Row | None:  # type: ignore[type-arg]
    """(id, name, teacher_id) — рұқсат тексеруге жеткілікті, бір шағын сұраныс."""
    return (
        await db.execute(
            select(Course.id, Course.name, Course.teacher_id).where(
                Course.id == course_id
            )
        )
    ).first()


def is_owner_or_admin(user: User, teacher_id: int | None) -> bool:
    return user.role == ADMIN or teacher_id == user.id


async def can_view_course(db: AsyncSession, course_id: int, viewer: User) -> bool:
    """Admin, курс иесі немесе тағайындалған топтың студенті. Бір EXISTS сұранысы."""
    if viewer.role == ADMIN:
        return True

    in_group = exists().where(
        course_groups.c.course_id == course_id,
        group_members.c.group_id == course_groups.c.group_id,
        group_members.c.student_id == viewer.id,
    )
    return bool(
        await db.scalar(
            select(
                exists().where(
                    Course.id == course_id,
                    or_(Course.teacher_id == viewer.id, in_group),
                )
            )
        )
    )


@dataclass(frozen=True, slots=True)
class TopicRef:
    id: int
    title: str
    course_id: int
    teacher_id: int | None


@dataclass(frozen=True, slots=True)
class AssignmentRef:
    id: int
    title: str
    topic_id: int
    topic_title: str
    course_id: int
    course_name: str
    teacher_id: int | None
    max_score: int


async def topic_ref(db: AsyncSession, topic_id: int) -> TopicRef | None:
    row = (
        await db.execute(
            select(Topic.id, Topic.title, Topic.course_id, Course.teacher_id)
            .join(Course, Course.id == Topic.course_id)
            .where(Topic.id == topic_id)
        )
    ).first()
    return TopicRef(*row) if row else None


async def assignment_ref(db: AsyncSession, assignment_id: int) -> AssignmentRef | None:
    """Тапсырма + тақырып + курс туралы қысқаша мәлімет: бір сұраныс, ағашсыз."""
    row = (
        await db.execute(
            select(
                Assignment.id,
                Assignment.title,
                Assignment.topic_id,
                Topic.title,
                Topic.course_id,
                Course.name,
                Course.teacher_id,
                Assignment.max_score,
            )
            .join(Topic, Topic.id == Assignment.topic_id)
            .join(Course, Course.id == Topic.course_id)
            .where(Assignment.id == assignment_id)
        )
    ).first()
    return AssignmentRef(*row) if row else None


async def create_course(
    db: AsyncSession,
    name: str,
    description: str | None,
    teacher_id: int | None,
    group_ids: Sequence[int],
    viewer: User,
) -> Course:
    await _check_teacher(db, teacher_id)
    groups = await _resolve_groups(db, group_ids, viewer)

    course = Course(name=name, description=description, teacher_id=teacher_id)
    course.groups = groups
    db.add(course)
    await db.commit()
    return await get_course(db, course.id)  # type: ignore[return-value]


async def update_course(
    db: AsyncSession, course: Course, changes: dict[str, object], viewer: User
) -> Course:
    course_id = course.id
    if "teacher_id" in changes:
        await _check_teacher(db, changes["teacher_id"])  # type: ignore[arg-type]
        course.teacher_id = changes["teacher_id"]  # type: ignore[assignment]
    if changes.get("name") is not None:
        course.name = str(changes["name"])
    if "description" in changes:
        course.description = changes["description"]  # type: ignore[assignment]
    if changes.get("group_ids") is not None:
        course.groups = await _resolve_groups(
            db,
            changes["group_ids"],  # type: ignore[arg-type]
            viewer,
            keep_ids=[group.id for group in course.groups],
        )

    await db.commit()
    return await get_course(db, course_id)  # type: ignore[return-value]


async def delete_course(db: AsyncSession, course_id: int) -> None:
    # ORM каскады үшін бүкіл ағаш жүктеледі.
    course = await db.scalar(
        select(Course)
        .where(Course.id == course_id)
        .options(_DELETE_TREE)
        .execution_options(populate_existing=True)
    )
    if course is not None:
        await db.delete(course)
        await db.commit()


async def _topic_full(db: AsyncSession, topic_id: int) -> Topic:
    return await db.scalar(  # type: ignore[return-value]
        select(Topic)
        .where(Topic.id == topic_id)
        .options(*_TOPIC_TREE)
        .execution_options(populate_existing=True)
    )


async def create_topic(db: AsyncSession, course_id: int, title: str) -> Topic:
    last = await db.scalar(
        select(func.max(Topic.position)).where(Topic.course_id == course_id)
    )
    topic = Topic(course_id=course_id, title=title, position=(last or 0) + 1)
    db.add(topic)
    await db.commit()
    return await _topic_full(db, topic.id)


async def update_topic(
    db: AsyncSession, topic_id: int, changes: dict[str, object]
) -> Topic:
    topic = await db.get(Topic, topic_id)  # ағашсыз: 1 сұраныс
    if topic is not None:
        if changes.get("title") is not None:
            topic.title = str(changes["title"])
        if changes.get("position") is not None:
            topic.position = int(changes["position"])  # type: ignore[arg-type]

    await db.commit()
    return await _topic_full(db, topic_id)


async def delete_topic(db: AsyncSession, topic_id: int) -> None:
    # ORM каскады үшін тақырып ағашы жүктеледі.
    topic = await db.scalar(
        select(Topic)
        .where(Topic.id == topic_id)
        .options(*_TOPIC_DELETE_TREE)
        .execution_options(populate_existing=True)
    )
    if topic is not None:
        await db.delete(topic)
        await db.commit()


async def create_assignment(
    db: AsyncSession, topic_id: int, data: dict[str, object]
) -> Assignment:
    assignment = Assignment(topic_id=topic_id, **data)
    db.add(assignment)
    await db.commit()
    return await get_assignment(db, assignment.id)  # type: ignore[return-value]


async def get_assignment(db: AsyncSession, assignment_id: int) -> Assignment | None:
    """files selectin арқылы келеді; populate_existing — ескірген күйді болдырмайды."""
    return await db.scalar(
        select(Assignment)
        .where(Assignment.id == assignment_id)
        .execution_options(populate_existing=True)
    )


async def update_assignment(
    db: AsyncSession, assignment: Assignment, changes: dict[str, object]
) -> Assignment:
    assignment_id = assignment.id
    for field, value in changes.items():
        setattr(assignment, field, value)

    await db.commit()
    return await get_assignment(db, assignment_id)  # type: ignore[return-value]


async def delete_assignment(db: AsyncSession, assignment: Assignment) -> None:
    await db.delete(assignment)
    await db.commit()


async def add_files(
    db: AsyncSession, assignment_id: int, files: Sequence[tuple[str, str, int]]
) -> Assignment:
    """Тапсырмаға тіркелген файлдарды жазады."""
    for filename, stored_name, size in files:
        db.add(
            AssignmentFile(
                assignment_id=assignment_id,
                filename=filename,
                stored_name=stored_name,
                size=size,
            )
        )
    await db.commit()
    return await get_assignment(db, assignment_id)  # type: ignore[return-value]


@dataclass(frozen=True, slots=True)
class FileRef:
    record: AssignmentFile
    course_id: int
    teacher_id: int | None


async def get_file(db: AsyncSession, file_id: int) -> FileRef | None:
    """Файл + оның курсы (рұқсат үшін): тапсырма/тақырып/курс ағашынсыз, бір сұраныс."""
    row = (
        await db.execute(
            select(AssignmentFile, Topic.course_id, Course.teacher_id)
            .join(Assignment, Assignment.id == AssignmentFile.assignment_id)
            .join(Topic, Topic.id == Assignment.topic_id)
            .join(Course, Course.id == Topic.course_id)
            .where(AssignmentFile.id == file_id)
        )
    ).first()
    return FileRef(*row) if row else None


async def delete_file(db: AsyncSession, record: AssignmentFile) -> None:
    await db.delete(record)
    await db.commit()
