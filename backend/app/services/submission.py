from collections.abc import Sequence
from datetime import UTC, datetime

from sqlalchemy import select
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


async def course_of(db: AsyncSession, assignment: Assignment) -> Course:
    topic = await db.get(Topic, assignment.topic_id)
    return await db.get(Course, topic.course_id)  # type: ignore[union-attr,return-value]


async def students_of(db: AsyncSession, course: Course) -> Sequence[User]:
    """Дисциплина тағайындалған топтардың барлық студенттері."""
    query = (
        select(User)
        .join(group_members, group_members.c.student_id == User.id)
        .join(course_groups, course_groups.c.group_id == group_members.c.group_id)
        .where(course_groups.c.course_id == course.id)
        .order_by(User.full_name, User.email)
        .distinct()
    )
    return (await db.scalars(query)).all()


async def _reload(db: AsyncSession, submission_id: int) -> Submission:
    """refresh() кірістірілген relationship-терді жүктемейді — қайта сұраймыз."""
    # Тек осы жазбаны ескіртеміз: expire_all() басқа объектілерді де құлатады.
    work = await db.get(Submission, submission_id)
    if work is not None:
        db.expire(work)
    return await db.scalar(  # type: ignore[return-value]
        select(Submission).where(Submission.id == submission_id)
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
    assignment: Assignment,
    student: User,
    text: str | None,
    link: str | None,
    files: Sequence[tuple[str, str, int]],
) -> Submission:
    """Жаңа нұсқа қосады; алдыңғы нұсқалар тарихта қалады."""
    submission = await get_submission(db, assignment.id, student.id)
    if submission is None:
        submission = Submission(assignment_id=assignment.id, student_id=student.id)
        db.add(submission)
        await db.flush()

    submission.status = SUBMITTED
    version = SubmissionVersion(submission_id=submission.id, text=text, link=link)
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
    return await _reload(db, submission.id)


async def review(
    db: AsyncSession,
    submission: Submission,
    score: int | None,
    comment: str | None,
    send_back: bool,
) -> Submission:
    submission.score = score
    submission.comment = comment
    submission.status = REVISION if send_back else REVIEWED
    submission.reviewed_at = datetime.now(UTC)

    await db.commit()
    return await _reload(db, submission.id)


async def get_file(db: AsyncSession, file_id: int) -> SubmissionFile | None:
    return await db.get(SubmissionFile, file_id)
