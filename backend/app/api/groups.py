from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import Db, require_role
from app.models import Group, User
from app.roles import ADMIN, TEACHER
from app.schemas.group import (
    AddStudentRequest,
    CreateGroupRequest,
    GroupDetailResponse,
    GroupResponse,
    UpdateGroupRequest,
)
from app.services import group as group_service
from app.services.group import (
    AlreadyInGroup,
    NotAStudent,
    StudentNotFound,
    TeacherNotFound,
)

router = APIRouter()

StaffUser = Annotated[User, Depends(require_role(ADMIN, TEACHER))]


async def _group_for(db: Db, group_id: int, user: User) -> Group:
    """Топты алады және өзгертуге рұқсатын тексереді."""
    group = await group_service.get_group(db, group_id)
    if group is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Группа не найдена")
    if user.role != ADMIN and group.teacher_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")
    return group


@router.get("")
async def list_groups(db: Db, user: StaffUser) -> list[GroupResponse]:
    groups = await group_service.list_groups(db, user)
    return [GroupResponse.model_validate(group) for group in groups]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_group(
    data: CreateGroupRequest, db: Db, user: StaffUser
) -> GroupResponse:
    # Преподаватель өзіне ғана топ аша алады.
    teacher_id = data.teacher_id if user.role == ADMIN else user.id
    try:
        group = await group_service.create_group(db, data.name, teacher_id)
    except TeacherNotFound:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Преподаватель не найден"
        ) from None
    return GroupResponse.model_validate(group)


@router.get("/{group_id}")
async def get_group(group_id: int, db: Db, user: StaffUser) -> GroupDetailResponse:
    group = await _group_for(db, group_id, user)
    return GroupDetailResponse.model_validate(group)


@router.patch("/{group_id}")
async def update_group(
    group_id: int, data: UpdateGroupRequest, db: Db, user: StaffUser
) -> GroupDetailResponse:
    group = await _group_for(db, group_id, user)
    # Преподавательді тек admin ауыстырады.
    teacher_id = data.teacher_id if user.role == ADMIN else group.teacher_id
    try:
        group = await group_service.update_group(db, group, data.name, teacher_id)
    except TeacherNotFound:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Преподаватель не найден"
        ) from None
    return GroupDetailResponse.model_validate(group)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(group_id: int, db: Db, user: StaffUser) -> None:
    group = await _group_for(db, group_id, user)
    await group_service.delete_group(db, group)


@router.post("/{group_id}/students", status_code=status.HTTP_201_CREATED)
async def add_student(
    group_id: int, data: AddStudentRequest, db: Db, user: StaffUser
) -> GroupDetailResponse:
    group = await _group_for(db, group_id, user)
    try:
        group = await group_service.add_student(db, group, data.email)
    except StudentNotFound:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "Пользователь с такой почтой не найден"
        ) from None
    except NotAStudent:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "В группу можно добавить только студента"
        ) from None
    except AlreadyInGroup:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Студент уже в этой группе"
        ) from None
    return GroupDetailResponse.model_validate(group)


@router.delete("/{group_id}/students/{student_id}")
async def remove_student(
    group_id: int, student_id: int, db: Db, user: StaffUser
) -> GroupDetailResponse:
    group = await _group_for(db, group_id, user)
    if not await group_service.remove_student(db, group, student_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Студент не найден в группе")
    return GroupDetailResponse.model_validate(group)
