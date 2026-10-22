from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Assignment, Group, Submission, Topic, User, course_groups
from app.models.group import group_members
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


async def build(db: AsyncSession, course_id: int) -> Gradebook:
    """Курс бойынша толық журнал: студенттер × тапсырмалар.

    Тек керек бағандар алынады: Submission/Assignment нысандары (нұсқалар, файлдар,
    студенттер) жүктелмейді."""
    items = (
        await db.execute(
            select(Assignment.id, Assignment.title, Assignment.max_score, Topic.title)
            .join(Topic, Topic.id == Assignment.topic_id)
            .where(Topic.course_id == course_id)
            .order_by(Topic.position, Assignment.id)
        )
    ).all()

    columns = [
        Column(id=item_id, title=title, topic_title=topic_title, max_score=max_score)
        for item_id, title, max_score, topic_title in items
    ]

    assignment_ids = [column.id for column in columns]
    works = (
        (
            await db.execute(
                select(
                    Submission.student_id,
                    Submission.assignment_id,
                    Submission.score,
                    Submission.status,
                ).where(Submission.assignment_id.in_(assignment_ids))
            )
        ).all()
        if assignment_ids
        else []
    )
    by_key = {(student_id, assignment_id): (score, status) for student_id, assignment_id, score, status in works}

    rows: list[Row] = []
    for student in await students_of(db, course_id):
        cells: list[Cell] = []
        scores: list[int] = []

        for column in columns:
            work = by_key.get((student.id, column.id))
            score = work[0] if work else None
            if score is not None:
                scores.append(score)
            cells.append(
                Cell(
                    assignment_id=column.id,
                    score=score,
                    status=work[1] if work else None,
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


async def students_by_group(
    db: AsyncSession, course_id: int
) -> list[tuple[str, User]]:
    """Excel «Студенты» парағы үшін: (топ атауы, студент), топ аты бойынша."""
    rows = await db.execute(
        select(Group.name, User)
        .join(course_groups, course_groups.c.group_id == Group.id)
        .join(group_members, group_members.c.group_id == Group.id)
        .join(User, User.id == group_members.c.student_id)
        .where(course_groups.c.course_id == course_id)
        .order_by(Group.name, Group.id, User.id)
    )
    return [(name, student) for name, student in rows.all()]
