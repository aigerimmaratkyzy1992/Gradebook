from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Assignment, Course, Submission, Topic, User
from app.services.submission import students_of


@dataclass
class Cell:
    assignment_id: int
    score: int | None
    status: str | None


@dataclass
class Row:
    student: User
    cells: list[Cell]
    average: float | None
    total: int


@dataclass
class Column:
    id: int
    title: str
    topic_title: str
    max_score: int


@dataclass
class Gradebook:
    columns: list[Column]
    rows: list[Row]


async def build(db: AsyncSession, course: Course) -> Gradebook:
    """Курс бойынша толық журнал: студенттер × тапсырмалар."""
    assignments = (
        await db.scalars(
            select(Assignment)
            .join(Topic, Topic.id == Assignment.topic_id)
            .where(Topic.course_id == course.id)
            .order_by(Topic.position, Assignment.id)
        )
    ).all()

    topics = {
        topic.id: topic.title
        for topic in (
            await db.scalars(select(Topic).where(Topic.course_id == course.id))
        ).all()
    }

    columns = [
        Column(
            id=item.id,
            title=item.title,
            topic_title=topics.get(item.topic_id, ""),
            max_score=item.max_score,
        )
        for item in assignments
    ]

    assignment_ids = [item.id for item in assignments]
    works = (
        (
            await db.scalars(
                select(Submission).where(Submission.assignment_id.in_(assignment_ids))
            )
        ).all()
        if assignment_ids
        else []
    )
    by_key = {(work.student_id, work.assignment_id): work for work in works}

    rows: list[Row] = []
    for student in await students_of(db, course):
        cells: list[Cell] = []
        scores: list[int] = []

        for column in columns:
            work = by_key.get((student.id, column.id))
            score = work.score if work else None
            if score is not None:
                scores.append(score)
            cells.append(
                Cell(
                    assignment_id=column.id,
                    score=score,
                    status=work.status if work else None,
                )
            )

        rows.append(
            Row(
                student=student,
                cells=cells,
                average=round(sum(scores) / len(scores), 1) if scores else None,
                total=sum(scores),
            )
        )

    return Gradebook(columns=columns, rows=rows)
