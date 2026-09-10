from collections.abc import Sequence
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Assignment, Notification, Submission
from app.services.submission import course_of, students_of

# Мерзімнен қанша уақыт бұрын ескерту жіберіледі.
REMIND_BEFORE = timedelta(hours=24)


async def notify(
    db: AsyncSession, user_ids: Sequence[int], text: str, link: str | None = None
) -> None:
    """Хабарламаларды қосады. Commit шақырушының жауапкершілігінде емес —
    хабарлама негізгі әрекетті бөгемеуі үшін осы жерде бекітіледі."""
    if not user_ids:
        return

    for user_id in set(user_ids):
        db.add(Notification(user_id=user_id, text=text, link=link))
    await db.commit()


async def list_for(
    db: AsyncSession, user_id: int, limit: int = 30
) -> Sequence[Notification]:
    return (
        await db.scalars(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.id.desc())
            .limit(limit)
        )
    ).all()


async def unread_count(db: AsyncSession, user_id: int) -> int:
    rows = await db.scalars(
        select(Notification.id).where(
            Notification.user_id == user_id, Notification.read_at.is_(None)
        )
    )
    return len(rows.all())


async def mark_all_read(db: AsyncSession, user_id: int) -> None:
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.read_at.is_(None))
        .values(read_at=datetime.now(UTC))
    )
    await db.commit()


async def send_due_reminders(db: AsyncSession) -> int:
    """Мерзімі жақындаған тапсырмалар туралы ескерту (әр тапсырмаға бір рет).

    Студентке — тапсырмағандарына, преподавательге — жалпы саны."""
    now = datetime.now(UTC)
    soon = (
        await db.scalars(
            select(Assignment).where(
                Assignment.due_at.is_not(None),
                Assignment.due_at > now,
                Assignment.due_at <= now + REMIND_BEFORE,
                Assignment.reminded_at.is_(None),
            )
        )
    ).all()

    for assignment in soon:
        course = await course_of(db, assignment)
        submitted = set(
            (
                await db.scalars(
                    select(Submission.student_id).where(
                        Submission.assignment_id == assignment.id
                    )
                )
            ).all()
        )
        pending = [
            student.id
            for student in await students_of(db, course)
            if student.id not in submitted
        ]
        link = f"/assignments/{assignment.id}"

        await notify(
            db, pending, f"Завтра заканчивается срок сдачи: {assignment.title}", link
        )
        if course.teacher_id and pending:
            await notify(
                db,
                [course.teacher_id],
                f"{len(pending)} студентов не сдали работу: {assignment.title}",
                link,
            )

        assignment.reminded_at = now

    await db.commit()
    return len(soon)
