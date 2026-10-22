from datetime import datetime

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import select

from app.api.deps import CurrentUser, Db
from app.models import Assignment, Course, Submission, Topic
from app.services import course as course_service

router = APIRouter()


class MyAssignmentResponse(BaseModel):
    id: int
    title: str
    due_at: datetime | None
    max_score: int
    course_id: int
    course_name: str
    topic_title: str
    status: str | None
    score: int | None
    comment: str | None


@router.get("/assignments")
async def my_assignments(db: Db, user: CurrentUser) -> list[MyAssignmentResponse]:
    """Пайдаланушыға қолжетімді барлық тапсырма — мерзімі мен күйімен бірге."""
    course_names = await course_service.visible_course_names(db, user)
    if not course_names:
        return []

    rows = (
        await db.execute(
            select(Assignment, Topic, Course)
            .join(Topic, Topic.id == Assignment.topic_id)
            .join(Course, Course.id == Topic.course_id)
            .where(Course.id.in_(course_names))
            .order_by(Assignment.due_at.is_(None), Assignment.due_at, Assignment.id)
        )
    ).all()

    works = {
        work.assignment_id: work
        for work in (
            await db.scalars(select(Submission).where(Submission.student_id == user.id))
        ).all()
    }

    return [
        MyAssignmentResponse(
            id=assignment.id,
            title=assignment.title,
            due_at=assignment.due_at,
            max_score=assignment.max_score,
            course_id=course.id,
            course_name=course.name,
            topic_title=topic.title,
            status=works[assignment.id].status if assignment.id in works else None,
            score=works[assignment.id].score if assignment.id in works else None,
            comment=works[assignment.id].comment if assignment.id in works else None,
        )
        for assignment, topic, course in rows
    ]
