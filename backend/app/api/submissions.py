from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response

from app.api.deps import CurrentUser, Db, require_role
from app.models import User
from app.roles import ADMIN, STUDENT, TEACHER
from app.schemas.submission import (
    ReviewRequest,
    StudentWorkResponse,
    SubmissionResponse,
)
from app.schemas.user import UserResponse
from app.services import course as course_service
from app.services.course import AssignmentRef
from app.services import notification as notification_service
from app.services import storage
from app.services import submission as submission_service
from app.services.storage import FileMissing, FileTooLarge, FileTypeNotAllowed

router = APIRouter()
files_router = APIRouter()

StaffUser = Annotated[User, Depends(require_role(ADMIN, TEACHER))]


async def _assignment(db: Db, assignment_id: int) -> AssignmentRef:
    """Тек бағандар (ағашсыз): рұқсат тексеруге және хабарламаға жеткілікті."""
    assignment = await course_service.assignment_ref(db, assignment_id)
    if assignment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Задание не найдено")
    return assignment


async def _assignment_for_view(db: Db, assignment_id: int, user: User) -> AssignmentRef:
    assignment = await _assignment(db, assignment_id)
    if not await course_service.can_view_course(db, assignment.course_id, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")
    return assignment


async def _assignment_for_review(
    db: Db, assignment_id: int, user: User
) -> AssignmentRef:
    assignment = await _assignment(db, assignment_id)
    if not course_service.is_owner_or_admin(user, assignment.teacher_id):
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

    work = await submission_service.submit(db, assignment.id, user.id, text, link, saved)

    if assignment.teacher_id:
        await notification_service.notify(
            db,
            [assignment.teacher_id],
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

    students = await submission_service.students_of(db, assignment.course_id)
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
    ref = await submission_service.submission_ref(db, submission_id)
    if ref is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Работа не найдена")

    assignment = await _assignment_for_review(db, ref.assignment_id, user)
    if data.score is not None and data.score > assignment.max_score:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Балл больше максимального")
    work = await submission_service.review(
        db, ref.id, data.score, data.comment, data.send_back
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
async def download_file(file_id: int, db: Db, user: CurrentUser) -> Response:
    access = await submission_service.get_file(db, file_id)
    if access is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")
    record = access.record

    # Өз жұмысын студент, қалғанын курс иесі мен admin көреді.
    allowed = (
        access.student_id == user.id
        or user.role == ADMIN
        or access.teacher_id == user.id
    )
    if not allowed:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")

    try:
        return await storage.download_response(record.filename, record.stored_name)
    except FileMissing:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Файл не сохранился на сервере — загрузите его заново",
        ) from None
