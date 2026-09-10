import random
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import CurrentUser, Db, require_role
from app.models import Course, Test, TestAttempt, Topic, User
from app.models.test import MATCH, QUESTION_KINDS
from app.roles import ADMIN, STUDENT, TEACHER
from app.schemas.test import (
    AttemptResultResponse,
    AttemptRowResponse,
    CreateQuestionRequest,
    CreateTestRequest,
    FinishAttemptRequest,
    OptionResponse,
    QuestionFullResponse,
    QuestionResponse,
    TestFullResponse,
    TestTakeResponse,
    UpdateQuestionRequest,
    UpdateTestRequest,
)
from app.schemas.user import UserResponse
from app.services import course as course_service
from app.services import notification as notification_service
from app.services import submission as submission_service
from app.services import test as test_service
from app.services.test import AttemptClosed, AttemptsExhausted, TestClosed

tests_router = APIRouter()
topics_router = APIRouter()
attempts_router = APIRouter()
questions_router = APIRouter()

StaffUser = Annotated[User, Depends(require_role(ADMIN, TEACHER))]
StudentUser = Annotated[User, Depends(require_role(STUDENT))]


async def _course_of_topic(db: Db, topic_id: int) -> Course:
    topic = await db.get(Topic, topic_id)
    if topic is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Тема не найдена")

    course = await course_service.get_course(db, topic.course_id)
    if course is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Дисциплина не найдена")
    return course


async def _test_for_edit(db: Db, test_id: int, user: User) -> Test:
    test = await test_service.get_test(db, test_id)
    if test is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Тест не найден")

    course = await _course_of_topic(db, test.topic_id)
    if user.role != ADMIN and course.teacher_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")
    return test


async def _test_for_view(db: Db, test_id: int, user: User) -> Test:
    test = await test_service.get_test(db, test_id)
    if test is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Тест не найден")

    course = await _course_of_topic(db, test.topic_id)
    if not await course_service.can_view(db, course, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")
    return test


def _full(test: Test) -> TestFullResponse:
    return TestFullResponse(
        id=test.id,
        topic_id=test.topic_id,
        title=test.title,
        description=test.description,
        time_limit_minutes=test.time_limit_minutes,
        attempts_allowed=test.attempts_allowed,
        due_at=test.due_at,
        shuffle_questions=test.shuffle_questions,
        shuffle_options=test.shuffle_options,
        show_result=test.show_result,
        questions=[
            QuestionFullResponse.model_validate(question) for question in test.questions
        ],
        max_score=test_service.max_score(test),
    )


@topics_router.post("/{topic_id}/tests", status_code=status.HTTP_201_CREATED)
async def create_test(
    topic_id: int, data: CreateTestRequest, db: Db, user: StaffUser
) -> TestFullResponse:
    course = await _course_of_topic(db, topic_id)
    if user.role != ADMIN and course.teacher_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")

    test = await test_service.create_test(db, topic_id, data.model_dump())

    students = await submission_service.students_of(db, course)
    await notification_service.notify(
        db,
        [student.id for student in students],
        f"Новый тест: {test.title}",
        f"/tests/{test.id}",
    )
    return _full(test)


@tests_router.get("/{test_id}")
async def get_test(test_id: int, db: Db, user: StaffUser) -> TestFullResponse:
    return _full(await _test_for_edit(db, test_id, user))


@tests_router.patch("/{test_id}")
async def update_test(
    test_id: int, data: UpdateTestRequest, db: Db, user: StaffUser
) -> TestFullResponse:
    test = await _test_for_edit(db, test_id, user)
    test = await test_service.update_test(db, test, data.model_dump(exclude_unset=True))
    return _full(test)


@tests_router.delete("/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test(test_id: int, db: Db, user: StaffUser) -> None:
    test = await _test_for_edit(db, test_id, user)
    await test_service.delete_test(db, test)


@tests_router.post("/{test_id}/questions", status_code=status.HTTP_201_CREATED)
async def add_question(
    test_id: int, data: CreateQuestionRequest, db: Db, user: StaffUser
) -> TestFullResponse:
    if data.kind not in QUESTION_KINDS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Неизвестный тип вопроса")

    test = await _test_for_edit(db, test_id, user)
    test = await test_service.add_question(
        db,
        test,
        data.kind,
        data.text,
        data.points,
        [option.model_dump() for option in data.options],
    )
    return _full(test)


@questions_router.patch("/{question_id}")
async def update_question(
    question_id: int, data: UpdateQuestionRequest, db: Db, user: StaffUser
) -> TestFullResponse:
    question = await test_service.get_question(db, question_id)
    if question is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Вопрос не найден")
    if data.kind is not None and data.kind not in QUESTION_KINDS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Неизвестный тип вопроса")

    await _test_for_edit(db, question.test_id, user)

    changes = data.model_dump(exclude_unset=True)
    if data.options is not None:
        changes["options"] = [option.model_dump() for option in data.options]

    test = await test_service.update_question(db, question, changes)
    return _full(test)


@questions_router.delete("/{question_id}", status_code=status.HTTP_200_OK)
async def delete_question(
    question_id: int, db: Db, user: StaffUser
) -> TestFullResponse:
    question = await test_service.get_question(db, question_id)
    if question is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Вопрос не найден")

    await _test_for_edit(db, question.test_id, user)
    test = await test_service.delete_question(db, question)
    return _full(test)


@tests_router.post("/{test_id}/start")
async def start_test(test_id: int, db: Db, user: StudentUser) -> TestTakeResponse:
    test = await _test_for_view(db, test_id, user)

    try:
        attempt = await test_service.start_attempt(db, test, user.id)
    except AttemptsExhausted:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Попытки закончились"
        ) from None
    except TestClosed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Срок теста истёк") from None

    seed = attempt.id
    questions: list[QuestionResponse] = []
    for question in test_service.question_order(test, seed):
        options = test_service.option_order(test, question, seed)
        targets = [option.match_text or "" for option in options]
        if question.kind == MATCH:
            random.Random(seed + question.id + 7).shuffle(targets)

        questions.append(
            QuestionResponse(
                id=question.id,
                kind=question.kind,
                text=question.text,
                points=question.points,
                options=[
                    OptionResponse(id=option.id, text=option.text) for option in options
                ],
                match_targets=targets if question.kind == MATCH else [],
            )
        )

    return TestTakeResponse(
        id=test.id,
        title=test.title,
        description=test.description,
        attempt_id=attempt.id,
        deadline=test_service.deadline_of(test, attempt),
        show_result=test.show_result,
        max_score=test_service.max_score(test),
        questions=questions,
    )


@attempts_router.post("/{attempt_id}/finish")
async def finish_attempt(
    attempt_id: int, data: FinishAttemptRequest, db: Db, user: StudentUser
) -> AttemptResultResponse:
    attempt = await db.get(TestAttempt, attempt_id)
    if attempt is None or attempt.student_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Попытка не найдена")

    test = await _test_for_view(db, attempt.test_id, user)

    answers: dict[int, object] = {}
    for answer in data.answers:
        answers[answer.question_id] = {
            "option_id": answer.option_id,
            "option_ids": answer.option_ids,
            "text": answer.text,
            "pairs": answer.pairs,
        }

    try:
        attempt = await test_service.finish_attempt(db, test, attempt, answers)
    except AttemptClosed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Попытка уже завершена") from None

    if test.show_result:
        await notification_service.notify(
            db,
            [user.id],
            f"Тест «{test.title}» завершён: {attempt.score} из {attempt.max_score}",
            f"/tests/{test.id}",
        )

    return AttemptResultResponse(
        id=attempt.id,
        score=attempt.score,
        max_score=attempt.max_score,
        finished_at=attempt.finished_at,
        show_result=test.show_result,
    )


@tests_router.get("/{test_id}/my-attempts")
async def my_attempts(test_id: int, db: Db, user: CurrentUser) -> list[AttemptResultResponse]:
    test = await _test_for_view(db, test_id, user)
    attempts = await test_service.attempts_of(db, test_id, user.id)

    return [
        AttemptResultResponse(
            id=attempt.id,
            score=attempt.score,
            max_score=attempt.max_score,
            finished_at=attempt.finished_at,
            show_result=test.show_result,
        )
        for attempt in attempts
    ]


@tests_router.get("/{test_id}/attempts")
async def list_attempts(
    test_id: int, db: Db, user: StaffUser
) -> list[AttemptRowResponse]:
    test = await _test_for_edit(db, test_id, user)
    course = await _course_of_topic(db, test.topic_id)

    attempts = await test_service.all_attempts(db, test_id)
    by_student: dict[int, list[TestAttempt]] = {}
    for attempt in attempts:
        by_student.setdefault(attempt.student_id, []).append(attempt)

    rows: list[AttemptRowResponse] = []
    for student in await submission_service.students_of(db, course):
        items = [
            item for item in by_student.get(student.id, []) if item.finished_at
        ]
        rows.append(
            AttemptRowResponse(
                student=UserResponse.model_validate(student),
                attempts=len(items),
                best_score=max((item.score for item in items), default=None),
                max_score=test_service.max_score(test),
                last_finished_at=max(
                    (item.finished_at for item in items if item.finished_at),
                    default=None,
                ),
            )
        )
    return rows
