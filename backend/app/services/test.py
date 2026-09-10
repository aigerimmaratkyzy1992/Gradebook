import json
import random
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Option, Question, Test, TestAnswer, TestAttempt
from app.models.test import MATCH, MULTIPLE, SHORT, SINGLE, TRUE_FALSE


class AttemptsExhausted(Exception):
    """Әрекет саны бітті."""


class AttemptClosed(Exception):
    """Әрекет аяқталған немесе уақыты өткен."""


class TestClosed(Exception):
    """Тест мерзімі өтіп кеткен."""


async def get_test(db: AsyncSession, test_id: int) -> Test | None:
    return await db.get(Test, test_id)


async def get_question(db: AsyncSession, question_id: int) -> Question | None:
    return await db.get(Question, question_id)


async def create_test(db: AsyncSession, topic_id: int, data: dict[str, object]) -> Test:
    test = Test(topic_id=topic_id, **data)
    db.add(test)
    await db.commit()
    return await _reload(db, test.id)


async def update_test(db: AsyncSession, test: Test, changes: dict[str, object]) -> Test:
    for field, value in changes.items():
        setattr(test, field, value)
    await db.commit()
    return await _reload(db, test.id)


async def delete_test(db: AsyncSession, test: Test) -> None:
    await db.delete(test)
    await db.commit()


async def _reload(db: AsyncSession, test_id: int) -> Test:
    test = await db.get(Test, test_id)
    if test is not None:
        db.expire(test)
    return await db.scalar(  # type: ignore[return-value]
        select(Test).where(Test.id == test_id)
    )


async def add_question(
    db: AsyncSession, test: Test, kind: str, text: str, points: int, options: list[dict]
) -> Test:
    position = max((item.position for item in test.questions), default=0) + 1
    question = Question(
        test_id=test.id, kind=kind, text=text, points=points, position=position
    )
    db.add(question)
    await db.flush()

    for option in options:
        db.add(
            Option(
                question_id=question.id,
                text=str(option.get("text", "")),
                is_correct=bool(option.get("is_correct", False)),
                match_text=option.get("match_text"),
            )
        )

    await db.commit()
    return await _reload(db, test.id)


async def update_question(
    db: AsyncSession, question: Question, changes: dict[str, object]
) -> Test:
    """Нұсқалар берілсе — олар түгел ауыстырылады (ескі жауаптар өшеді)."""
    if changes.get("kind") is not None:
        question.kind = str(changes["kind"])
    if changes.get("text") is not None:
        question.text = str(changes["text"])
    if changes.get("points") is not None:
        question.points = int(changes["points"])  # type: ignore[arg-type]

    options = changes.get("options")
    if options is not None:
        question.options.clear()
        await db.flush()
        for option in options:  # type: ignore[union-attr]
            db.add(
                Option(
                    question_id=question.id,
                    text=str(option.get("text", "")),
                    is_correct=bool(option.get("is_correct", False)),
                    match_text=option.get("match_text"),
                )
            )

    test_id = question.test_id
    await db.commit()
    return await _reload(db, test_id)


async def delete_question(db: AsyncSession, question: Question) -> Test:
    test_id = question.test_id
    await db.delete(question)
    await db.commit()
    return await _reload(db, test_id)


def max_score(test: Test) -> int:
    return sum(question.points for question in test.questions)


async def attempts_of(
    db: AsyncSession, test_id: int, student_id: int
) -> Sequence[TestAttempt]:
    return (
        await db.scalars(
            select(TestAttempt)
            .where(
                TestAttempt.test_id == test_id, TestAttempt.student_id == student_id
            )
            .order_by(TestAttempt.id)
        )
    ).all()


async def all_attempts(db: AsyncSession, test_id: int) -> Sequence[TestAttempt]:
    return (
        await db.scalars(
            select(TestAttempt)
            .where(TestAttempt.test_id == test_id)
            .order_by(TestAttempt.id)
        )
    ).all()


async def start_attempt(
    db: AsyncSession, test: Test, student_id: int
) -> TestAttempt:
    if test.due_at and test.due_at < datetime.now(UTC):
        raise TestClosed

    previous = await attempts_of(db, test.id, student_id)
    unfinished = next((item for item in previous if item.finished_at is None), None)
    if unfinished is not None:
        return unfinished
    if len(previous) >= test.attempts_allowed:
        raise AttemptsExhausted

    attempt = TestAttempt(
        test_id=test.id, student_id=student_id, max_score=max_score(test)
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    return attempt


def question_order(test: Test, seed: int) -> list[Question]:
    questions = list(test.questions)
    if test.shuffle_questions:
        random.Random(seed).shuffle(questions)
    return questions


def option_order(test: Test, question: Question, seed: int) -> list[Option]:
    options = list(question.options)
    if test.shuffle_options:
        random.Random(seed + question.id).shuffle(options)
    return options


def _check(question: Question, value: object) -> bool:
    """Жауапты автоматты тексеру."""
    if not isinstance(value, dict):
        return False

    if question.kind in (SINGLE, TRUE_FALSE):
        chosen = value.get("option_id")
        return any(
            option.is_correct and option.id == chosen for option in question.options
        )

    if question.kind == MULTIPLE:
        chosen = {int(item) for item in value.get("option_ids", []) or []}
        correct = {option.id for option in question.options if option.is_correct}
        return bool(correct) and chosen == correct

    if question.kind == SHORT:
        answer = str(value.get("text", "")).strip().casefold()
        return bool(answer) and any(
            option.is_correct and option.text.strip().casefold() == answer
            for option in question.options
        )

    if question.kind == MATCH:
        pairs = value.get("pairs") or {}
        if not isinstance(pairs, dict) or not question.options:
            return False
        return all(
            str(pairs.get(str(option.id), "")).strip() == (option.match_text or "").strip()
            for option in question.options
        )

    return False


async def finish_attempt(
    db: AsyncSession, test: Test, attempt: TestAttempt, answers: dict[int, object]
) -> TestAttempt:
    if attempt.finished_at is not None:
        raise AttemptClosed

    # Уақыт шектеуі: кешіккен жауаптар да есептеледі, бірақ әрекет жабылады.
    score = 0
    for question in test.questions:
        value = answers.get(question.id)
        correct = _check(question, value)
        points = question.points if correct else 0
        score += points
        db.add(
            TestAnswer(
                attempt_id=attempt.id,
                question_id=question.id,
                value=json.dumps(value, ensure_ascii=False) if value is not None else None,
                is_correct=correct,
                points=points,
            )
        )

    attempt.score = score
    attempt.max_score = max_score(test)
    attempt.finished_at = datetime.now(UTC)
    await db.commit()

    # id-ді алдын ала ұстаймыз: expire-ден кейін атрибут оқу IO тудырады.
    attempt_id = attempt.id
    db.expire(attempt)
    return await db.scalar(  # type: ignore[return-value]
        select(TestAttempt).where(TestAttempt.id == attempt_id)
    )


def deadline_of(test: Test, attempt: TestAttempt) -> datetime | None:
    if test.time_limit_minutes is None:
        return None
    return attempt.started_at + timedelta(minutes=test.time_limit_minutes)
