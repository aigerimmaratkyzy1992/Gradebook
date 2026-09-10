from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.api.deps import CurrentUser, Db, require_role
from app.models import Assignment, Submission, SubmissionVersion, User
from app.roles import ADMIN, STUDENT, TEACHER
from app.schemas.submission import (
    ReviewRequest,
    StudentWorkResponse,
    SubmissionResponse,
)
from app.schemas.user import UserResponse
from app.services import course as course_service
from app.services import notification as notification_service
from app.services import storage
from app.services import submission as submission_service
from app.services.storage import FileTooLarge, FileTypeNotAllowed

router = APIRouter()
files_router = APIRouter()

StaffUser = Annotated[User, Depends(require_role(ADMIN, TEACHER))]


async def _assignment(db: Db, assignment_id: int) -> Assignment:
    assignment = await course_service.get_assignment(db, assignment_id)
    if assignment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Задание не найдено")
    return assignment


async def _assignment_for_view(db: Db, assignment_id: int, user: User) -> Assignment:
    assignment = await _assignment(db, assignment_id)
    course = await submission_service.course_of(db, assignment)
    if not await course_service.can_view(db, course, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")
    return assignment


async def _assignment_for_review(db: Db, assignment_id: int, user: User) -> Assignment:
    assignment = await _assignment(db, assignment_id)
    course = await submission_service.course_of(db, assignment)
    if user.role != ADMIN and course.teacher_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")
    return assignment


@router.post("/{assignment_id}/submit", status_code=status.HTTP_201_CREATED)
async def submit_work(
    assignment_id: int,
    db: Db,
    user: Annotated[User, Depends(require_role(STUDENT))],
    text: Annotated[str | None, Form()] = None,
    link: Annotated[str | None, Form()] = None,
    files: Annotated[list[UploadFile] | None, File()] = None,
) -> SubmissionResponse:
    assignment = await _assignment_for_view(db, assignment_id, user)
    uploads = [item for item in (files or []) if item.filename]

    if not text and not link and not uploads:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Прикрепите файл, ссылку или напишите ответ",
        )

    saved: list[tuple[str, str, int]] = []
    for upload in uploads:
        try:
            stored_name, size = await storage.save(upload)
        except FileTypeNotAllowed:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Файл {upload.filename}: недопустимый формат",
            ) from None
        except FileTooLarge:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Файл {upload.filename}: больше 20 МБ",
            ) from None
        saved.append((str(upload.filename), stored_name, size))

    work = await submission_service.submit(db, assignment, user, text, link, saved)

    course = await submission_service.course_of(db, assignment)
    if course.teacher_id:
        await notification_service.notify(
            db,
            [course.teacher_id],
            f"{user.full_name or user.email} сдал работу: {assignment.title}",
            f"/assignments/{assignment.id}",
        )
    return SubmissionResponse.model_validate(work)


@router.get("/{assignment_id}/submission")
async def my_submission(
    assignment_id: int, db: Db, user: CurrentUser
) -> SubmissionResponse | None:
    await _assignment_for_view(db, assignment_id, user)
    work = await submission_service.get_submission(db, assignment_id, user.id)
    return SubmissionResponse.model_validate(work) if work else None


@router.get("/{assignment_id}/submissions")
async def list_works(
    assignment_id: int, db: Db, user: StaffUser
) -> list[StudentWorkResponse]:
    """Тексеру кестесі: топтағы әр студент — бір жол."""
    assignment = await _assignment_for_review(db, assignment_id, user)
    course = await submission_service.course_of(db, assignment)

    students = await submission_service.students_of(db, course)
    works = {
        work.student_id: work
        for work in await submission_service.list_submissions(db, assignment_id)
    }

    return [
        StudentWorkResponse(
            student=UserResponse.model_validate(student),
            submission=(
                SubmissionResponse.model_validate(works[student.id])
                if student.id in works
                else None
            ),
        )
        for student in students
    ]


@router.post("/submissions/{submission_id}/review")
async def review_work(
    submission_id: int, data: ReviewRequest, db: Db, user: StaffUser
) -> SubmissionResponse:
    work = await db.get(Submission, submission_id)
    if work is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Работа не найдена")

    assignment = await _assignment_for_review(db, work.assignment_id, user)
    work = await submission_service.review(
        db, work, data.score, data.comment, data.send_back
    )

    await notification_service.notify(
        db,
        [work.student_id],
        (
            f"Работа отправлена на доработку: {assignment.title}"
            if data.send_back
            else f"Работа проверена: {assignment.title}"
        ),
        f"/assignments/{assignment.id}",
    )
    return SubmissionResponse.model_validate(work)


@files_router.get("/{file_id}")
async def download_file(file_id: int, db: Db, user: CurrentUser) -> FileResponse:
    record = await submission_service.get_file(db, file_id)
    if record is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")

    version = await db.get(SubmissionVersion, record.version_id)
    work = await db.get(Submission, version.submission_id)  # type: ignore[union-attr]
    assignment = await _assignment(db, work.assignment_id)  # type: ignore[union-attr]
    course = await submission_service.course_of(db, assignment)

    # Өз жұмысын студент, қалғанын курс иесі мен admin көреді.
    allowed = (
        work.student_id == user.id  # type: ignore[union-attr]
        or user.role == ADMIN
        or course.teacher_id == user.id
    )
    if not allowed:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")

    path = storage.path_for(record.stored_name)
    if not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден на диске")
    return FileResponse(path, filename=record.filename)
