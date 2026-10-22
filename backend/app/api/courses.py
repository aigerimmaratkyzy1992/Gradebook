from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import Row

from app.api.deps import CurrentUser, Db, require_role
from app.models import Assignment, User
from app.roles import ADMIN, TEACHER
from app.schemas.course import (
    AssignmentDetailResponse,
    AssignmentResponse,
    CourseDetailResponse,
    CourseResponse,
    CreateAssignmentRequest,
    CreateCourseRequest,
    CreateTopicRequest,
    TopicResponse,
    UpdateAssignmentRequest,
    UpdateCourseRequest,
    UpdateTopicRequest,
)
from app.services import course as course_service
from app.services import notification as notification_service
from app.services import storage
from app.services import submission as submission_service
from app.services.course import (
    AssignmentRef,
    FileRef,
    GroupNotAvailable,
    TeacherNotFound,
    TopicRef,
)
from app.services.storage import FileMissing, FileTooLarge, FileTypeNotAllowed

router = APIRouter()
topics_router = APIRouter()
assignments_router = APIRouter()

StaffUser = Annotated[User, Depends(require_role(ADMIN, TEACHER))]


async def _course_row_for_edit(db: Db, course_id: int, user: User) -> Row:  # type: ignore[type-arg]
    """Дисциплинаны бағандармен ғана алып, өзгертуге рұқсатты тексереді."""
    row = await course_service.course_row(db, course_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Дисциплина не найдена")
    if not course_service.is_owner_or_admin(user, row.teacher_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")
    return row


@router.get("")
async def list_courses(db: Db, user: CurrentUser) -> list[CourseResponse]:
    courses = await course_service.list_courses(db, user)
    return [CourseResponse.model_validate(course) for course in courses]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_course(
    data: CreateCourseRequest, db: Db, user: StaffUser
) -> CourseDetailResponse:
    # Преподаватель дисциплинаны өзіне ғана аша алады.
    teacher_id = data.teacher_id if user.role == ADMIN else user.id
    try:
        course = await course_service.create_course(
            db, data.name, data.description, teacher_id, data.group_ids, user
        )
    except TeacherNotFound:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Преподаватель не найден"
        ) from None
    except GroupNotAvailable:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Группа не найдена или недоступна"
        ) from None
    return CourseDetailResponse.model_validate(course)


@router.get("/{course_id}")
async def get_course(course_id: int, db: Db, user: CurrentUser) -> CourseDetailResponse:
    course = await course_service.get_course(db, course_id)
    if course is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Дисциплина не найдена")
    if not await course_service.can_view_course(db, course.id, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")
    return CourseDetailResponse.model_validate(course)


@router.patch("/{course_id}")
async def update_course(
    course_id: int, data: UpdateCourseRequest, db: Db, user: StaffUser
) -> CourseDetailResponse:
    await _course_row_for_edit(db, course_id, user)
    course = await course_service.get_course_shallow(db, course_id)
    changes = data.model_dump(exclude_unset=True)
    # Преподавательді тек admin ауыстырады.
    if user.role != ADMIN:
        changes.pop("teacher_id", None)

    try:
        course = await course_service.update_course(db, course, changes, user)  # type: ignore[arg-type]
    except TeacherNotFound:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Преподаватель не найден"
        ) from None
    except GroupNotAvailable:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Группа не найдена или недоступна"
        ) from None
    return CourseDetailResponse.model_validate(course)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(course_id: int, db: Db, user: StaffUser) -> None:
    await _course_row_for_edit(db, course_id, user)
    await course_service.delete_course(db, course_id)


@router.post("/{course_id}/topics", status_code=status.HTTP_201_CREATED)
async def create_topic(
    course_id: int, data: CreateTopicRequest, db: Db, user: StaffUser
) -> TopicResponse:
    await _course_row_for_edit(db, course_id, user)
    topic = await course_service.create_topic(db, course_id, data.title)
    return TopicResponse.model_validate(topic)


async def _topic_for_edit(db: Db, topic_id: int, user: User) -> TopicRef:
    """Тақырып ағашын жүктемей, тек курс иесін тексереді."""
    topic = await course_service.topic_ref(db, topic_id)
    if topic is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Тема не найдена")
    if not course_service.is_owner_or_admin(user, topic.teacher_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")
    return topic


@topics_router.patch("/{topic_id}")
async def update_topic(
    topic_id: int, data: UpdateTopicRequest, db: Db, user: StaffUser
) -> TopicResponse:
    await _topic_for_edit(db, topic_id, user)
    topic = await course_service.update_topic(
        db, topic_id, data.model_dump(exclude_unset=True)
    )
    return TopicResponse.model_validate(topic)


@topics_router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topic(topic_id: int, db: Db, user: StaffUser) -> None:
    await _topic_for_edit(db, topic_id, user)
    await course_service.delete_topic(db, topic_id)


@topics_router.post("/{topic_id}/assignments", status_code=status.HTTP_201_CREATED)
async def create_assignment(
    topic_id: int, data: CreateAssignmentRequest, db: Db, user: StaffUser
) -> AssignmentResponse:
    topic = await _topic_for_edit(db, topic_id, user)
    assignment = await course_service.create_assignment(
        db, topic_id, data.model_dump()
    )

    students = await submission_service.students_of(db, topic.course_id)
    await notification_service.notify(
        db,
        [student.id for student in students],
        f"Новое задание: {assignment.title}",
        f"/assignments/{assignment.id}",
    )
    return AssignmentResponse.model_validate(assignment)


async def _assignment(db: Db, assignment_id: int) -> Assignment:
    assignment = await course_service.get_assignment(db, assignment_id)
    if assignment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Задание не найдено")
    return assignment


async def _assignment_ref(db: Db, assignment_id: int) -> AssignmentRef:
    """Бағандар ғана: рұқсат тексеруге ағашты жүктеудің қажеті жоқ."""
    ref = await course_service.assignment_ref(db, assignment_id)
    if ref is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Задание не найдено")
    return ref


async def _assignment_ref_for_edit(
    db: Db, assignment_id: int, user: User
) -> AssignmentRef:
    ref = await _assignment_ref(db, assignment_id)
    if not course_service.is_owner_or_admin(user, ref.teacher_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")
    return ref


@assignments_router.get("/{assignment_id}")
async def get_assignment(
    assignment_id: int, db: Db, user: CurrentUser
) -> AssignmentDetailResponse:
    ref = await _assignment_ref(db, assignment_id)
    if not await course_service.can_view_course(db, ref.course_id, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")

    assignment = await _assignment(db, assignment_id)
    return AssignmentDetailResponse(
        **AssignmentResponse.model_validate(assignment).model_dump(),
        topic_title=ref.topic_title,
        course_id=ref.course_id,
        course_name=ref.course_name,
    )


@assignments_router.patch("/{assignment_id}")
async def update_assignment(
    assignment_id: int, data: UpdateAssignmentRequest, db: Db, user: StaffUser
) -> AssignmentResponse:
    await _assignment_ref_for_edit(db, assignment_id, user)
    assignment = await _assignment(db, assignment_id)
    assignment = await course_service.update_assignment(
        db, assignment, data.model_dump(exclude_unset=True)
    )
    return AssignmentResponse.model_validate(assignment)


@assignments_router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(assignment_id: int, db: Db, user: StaffUser) -> None:
    await _assignment_ref_for_edit(db, assignment_id, user)
    assignment = await _assignment(db, assignment_id)
    await course_service.delete_assignment(db, assignment)


@assignments_router.post("/{assignment_id}/files", status_code=status.HTTP_201_CREATED)
async def upload_assignment_files(
    assignment_id: int,
    db: Db,
    user: StaffUser,
    files: Annotated[list[UploadFile], File()],
) -> AssignmentResponse:
    """Тапсырмаға материал файлдарын тіркеу."""
    await _assignment_ref_for_edit(db, assignment_id, user)

    saved: list[tuple[str, str, int]] = []
    for upload in [item for item in files if item.filename]:
        try:
            stored_name, size = await storage.save(upload)
        except FileTypeNotAllowed:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Файл {upload.filename}: недопустимый формат",
            ) from None
        except FileTooLarge:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, f"Файл {upload.filename}: больше 20 МБ"
            ) from None
        saved.append((str(upload.filename), stored_name, size))

    assignment = await course_service.add_files(db, assignment_id, saved)
    return AssignmentResponse.model_validate(assignment)


async def _assignment_file(db: Db, file_id: int) -> FileRef:
    ref = await course_service.get_file(db, file_id)
    if ref is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")
    return ref


@assignments_router.get("/files/{file_id}")
async def download_assignment_file(
    file_id: int, db: Db, user: CurrentUser
) -> Response:
    # Файл + курс бір сұраныста, рұқсат — бір EXISTS: барлығы шағын сұраныстар.
    ref = await _assignment_file(db, file_id)
    if not await course_service.can_view_course(db, ref.course_id, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")

    try:
        return await storage.download_response(
            ref.record.filename, ref.record.stored_name
        )
    except FileMissing:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Файл не сохранился на сервере — загрузите его заново",
        ) from None


@assignments_router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment_file(file_id: int, db: Db, user: StaffUser) -> None:
    ref = await _assignment_file(db, file_id)
    if not course_service.is_owner_or_admin(user, ref.teacher_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")
    await course_service.delete_file(db, ref.record)
