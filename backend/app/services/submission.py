from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Assignment,
    Course,
    Submission,
    SubmissionFile,
    SubmissionVersion,
    Topic,
    User,
    course_groups,
)
from app.models.group import group_members
from app.models.submission import REVIEWED, REVISION, SUBMITTED


async def students_of(db: AsyncSession, course_id: int) -> Sequence[User]:
    """Дисциплина тағайындалған топтардың барлық студенттері."""
    query = (
        select(User)
        .join(group_members, group_members.c.student_id == User.id)
        .join(course_groups, course_groups.c.group_id == group_members.c.group_id)
        .where(course_groups.c.course_id == course_id)
        .order_by(User.full_name, User.email)
        .distinct()
    )
    return (await db.scalars(query)).all()


async def _reload(db: AsyncSession, submission_id: int) -> Submission:
    """Бір select: populate_existing сессиядағы нысанды (қатарларымен) жаңартады.

    expire_all() қолданбаймыз — басқа объектілерді де құлатады."""
    return await db.scalar(  # type: ignore[return-value]
        select(Submission)
        .where(Submission.id == submission_id)
        .execution_options(populate_existing=True)
    )


async def get_submission(
    db: AsyncSession, assignment_id: int, student_id: int
) -> Submission | None:
    return await db.scalar(
        select(Submission).where(
            Submission.assignment_id == assignment_id,
            Submission.student_id == student_id,
        )
    )


async def list_submissions(
    db: AsyncSession, assignment_id: int
) -> Sequence[Submission]:
    return (
        await db.scalars(
            select(Submission).where(Submission.assignment_id == assignment_id)
        )
    ).all()


async def submit(
    db: AsyncSession,
    assignment_id: int,
    student_id: int,
    text: str | None,
    link: str | None,
    files: Sequence[tuple[str, str, int]],
) -> Submission:
    """Жаңа нұсқа қосады; алдыңғы нұсқалар тарихта қалады."""
    submission_id = await db.scalar(
        select(Submission.id).where(
            Submission.assignment_id == assignment_id,
            Submission.student_id == student_id,
        )
    )
    if submission_id is None:
        submission = Submission(
            assignment_id=assignment_id, student_id=student_id, status=SUBMITTED
        )
        db.add(submission)
        await db.flush()
        submission_id = submission.id
    else:
        await db.execute(
            update(Submission)
            .where(Submission.id == submission_id)
            .values(status=SUBMITTED)
        )

    version = SubmissionVersion(submission_id=submission_id, text=text, link=link)
    db.add(version)
    await db.flush()

    for filename, stored_name, size in files:
        db.add(
            SubmissionFile(
                version_id=version.id,
                filename=filename,
                stored_name=stored_name,
                size=size,
            )
        )

    await db.commit()
    return await _reload(db, submission_id)


@dataclass(frozen=True, slots=True)
class SubmissionRef:
    id: int
    assignment_id: int
    student_id: int


async def submission_ref(db: AsyncSession, submission_id: int) -> SubmissionRef | None:
    row = (
        await db.execute(
            select(
                Submission.id, Submission.assignment_id, Submission.student_id
            ).where(Submission.id == submission_id)
        )
    ).first()
    return SubmissionRef(*row) if row else None


async def review(
    db: AsyncSession,
    submission_id: int,
    score: int | None,
    comment: str | None,
    send_back: bool,
) -> Submission:
    await db.execute(
        update(Submission)
        .where(Submission.id == submission_id)
        .values(
            score=score,
            comment=comment,
            status=REVISION if send_back else REVIEWED,
            reviewed_at=datetime.now(UTC),
        )
    )
    await db.commit()
    return await _reload(db, submission_id)


@dataclass(frozen=True, slots=True)
class FileAccess:
    record: SubmissionFile
    student_id: int
    teacher_id: int | None


async def get_file(db: AsyncSession, file_id: int) -> FileAccess | None:
    """Файл + жұмыс иесі + курс иесі: жүктеуге рұқсат тексеру үшін бір сұраныс."""
    row = (
        await db.execute(
            select(SubmissionFile, Submission.student_id, Course.teacher_id)
            .join(SubmissionVersion, SubmissionVersion.id == SubmissionFile.version_id)
            .join(Submission, Submission.id == SubmissionVersion.submission_id)
            .join(Assignment, Assignment.id == Submission.assignment_id)
            .join(Topic, Topic.id == Assignment.topic_id)
            .join(Course, Course.id == Topic.course_id)
            .where(SubmissionFile.id == file_id)
        )
    ).first()
    return FileAccess(*row) if row else None
