from datetime import time
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select

from app.api.deps import CurrentUser, Db, require_role
from app.models import Course, Group, Lesson, User, course_groups
from app.models.group import group_members
from app.roles import ADMIN, STUDENT, TEACHER
from app.schemas.course import GroupBrief

router = APIRouter()

StaffUser = Annotated[User, Depends(require_role(ADMIN, TEACHER))]


class CourseBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class LessonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    weekday: int
    starts_at: time
    ends_at: time
    room: str | None
    course: CourseBrief
    group: GroupBrief


class CreateLessonRequest(BaseModel):
    course_id: int
    group_id: int
    weekday: int = Field(ge=0, le=6)
    starts_at: time
    ends_at: time
    room: str | None = Field(default=None, max_length=50)


class UpdateLessonRequest(BaseModel):
    course_id: int | None = None
    group_id: int | None = None
    weekday: int | None = Field(default=None, ge=0, le=6)
    starts_at: time | None = None
    ends_at: time | None = None
    room: str | None = Field(default=None, max_length=50)


async def _validate(
    db: Db,
    user: User,
    course_id: int,
    group_id: int,
    starts_at: time,
    ends_at: time,
) -> None:
    """Дисциплина/топ бар ма, рұқсат бар ма, уақыт дұрыс па."""
    course = await db.get(Course, course_id)
    group = await db.get(Group, group_id)
    if course is None or group is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "Дисциплина или группа не найдена"
        )
    if user.role != ADMIN and course.teacher_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")
    if ends_at <= starts_at:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Время окончания должно быть позже начала"
        )

    linked = await db.scalar(
        select(course_groups.c.group_id).where(
            course_groups.c.course_id == course.id,
            course_groups.c.group_id == group.id,
        )
    )
    if linked is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Эта группа не изучает выбранную дисциплину"
        )


@router.get("")
async def list_lessons(db: Db, user: CurrentUser) -> list[LessonResponse]:
    """Admin — бәрін, преподаватель — өз дисциплиналарын, студент — өз топтарын."""
    query = select(Lesson).order_by(Lesson.weekday, Lesson.starts_at)

    if user.role == TEACHER:
        query = query.join(Course, Course.id == Lesson.course_id).where(
            Course.teacher_id == user.id
        )
    elif user.role == STUDENT:
        query = query.join(
            group_members, group_members.c.group_id == Lesson.group_id
        ).where(group_members.c.student_id == user.id)

    lessons = (await db.scalars(query)).all()
    return [LessonResponse.model_validate(lesson) for lesson in lessons]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_lesson(
    data: CreateLessonRequest, db: Db, user: StaffUser
) -> LessonResponse:
    await _validate(
        db, user, data.course_id, data.group_id, data.starts_at, data.ends_at
    )

    lesson = Lesson(**data.model_dump())
    db.add(lesson)
    await db.commit()

    return LessonResponse.model_validate(
        await db.scalar(select(Lesson).where(Lesson.id == lesson.id))
    )


@router.patch("/{lesson_id}")
async def update_lesson(
    lesson_id: int, data: UpdateLessonRequest, db: Db, user: StaffUser
) -> LessonResponse:
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Занятие не найдено")

    # Ескі мәндерді жаңасымен араластырып, толық жиынды тексереміз.
    changes = data.model_dump(exclude_unset=True)
    course_id = changes.get("course_id", lesson.course_id)
    group_id = changes.get("group_id", lesson.group_id)
    starts_at = changes.get("starts_at", lesson.starts_at)
    ends_at = changes.get("ends_at", lesson.ends_at)

    await _validate(db, user, course_id, group_id, starts_at, ends_at)
    # Бөтен сабақты өзгертуге жол жоқ: ескі дисциплинасын да тексереміз.
    old_course = await db.get(Course, lesson.course_id)
    if user.role != ADMIN and old_course.teacher_id != user.id:  # type: ignore[union-attr]
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")

    for field, value in changes.items():
        setattr(lesson, field, value)
    await db.commit()

    # Байланыстар кэште ескі қалмас үшін жазбаны ескіртіп, қайта оқимыз.
    lesson_id_ = lesson.id
    db.expire(lesson)
    return LessonResponse.model_validate(
        await db.scalar(select(Lesson).where(Lesson.id == lesson_id_))
    )


@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(lesson_id: int, db: Db, user: StaffUser) -> None:
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Занятие не найдено")

    course = await db.get(Course, lesson.course_id)
    if user.role != ADMIN and course.teacher_id != user.id:  # type: ignore[union-attr]
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")

    await db.delete(lesson)
    await db.commit()
