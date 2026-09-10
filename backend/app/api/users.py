from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import CurrentUser, Db, require_role
from app.config import settings
from app.models import User
from app.roles import ADMIN, STUDENT, TEACHER, Role
from app.schemas.auth import TokenResponse
from app.schemas.user import (
    ChangePasswordRequest,
    CreateUserRequest,
    ResetPasswordResponse,
    UpdateProfileRequest,
    UpdateUserRequest,
    UserResponse,
)
from app.services import auth as auth_service, user as user_service
from app.services.auth import EmailAlreadyUsed
from app.services.user import WrongPassword

router = APIRouter()

AdminUser = Annotated[User, Depends(require_role(ADMIN))]
StaffUser = Annotated[User, Depends(require_role(ADMIN, TEACHER))]


@router.get("")
async def list_users(
    db: Db, user: StaffUser, role: Role | None = None
) -> list[UserResponse]:
    # Преподаватель топқа қосу үшін студенттер тізімін ғана көре алады.
    if user.role != ADMIN and role != STUDENT:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав")

    users = await user_service.list_users(db, role)
    return [UserResponse.model_validate(item) for item in users]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_user(
    data: CreateUserRequest, db: Db, admin: AdminUser
) -> UserResponse:
    try:
        user = await auth_service.register(
            db, data.email, data.password, data.role, data.full_name
        )
    except EmailAlreadyUsed:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Такая почта уже зарегистрирована"
        ) from None
    return UserResponse.model_validate(user)


@router.get("/me")
async def me(user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(user)


@router.patch("/me")
async def update_me(
    data: UpdateProfileRequest, db: Db, user: CurrentUser
) -> UserResponse:
    name = (data.full_name or "").strip()
    user.full_name = name or None
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.post("/me/password")
async def change_my_password(
    data: ChangePasswordRequest, db: Db, user: CurrentUser
) -> TokenResponse:
    """Өз паролін ауыстыру. Ескі токендер жарамсыз болғандықтан — жаңасы қайтарылады."""
    try:
        user = await user_service.change_password(
            db, user, data.current_password, data.new_password
        )
    except WrongPassword:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Текущий пароль указан неверно"
        ) from None
    return TokenResponse(access_token=auth_service.create_access_token(user))


@router.post("/{user_id}/reset-password")
async def reset_user_password(
    user_id: int, db: Db, admin: AdminUser
) -> ResetPasswordResponse:
    """Admin паролін стандартты парольге қайтарады — пайдаланушы онымен кіріп,
    профильде өзгертіп алады."""
    if user_id == admin.id:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Нельзя сбросить собственный пароль"
        )

    user = await user_service.update_user(
        db, user_id, {"password": settings.default_password}
    )
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")

    return ResetPasswordResponse(
        user=UserResponse.model_validate(user), password=settings.default_password
    )


@router.patch("/{user_id}")
async def update_user(
    user_id: int, data: UpdateUserRequest, db: Db, admin: AdminUser
) -> UserResponse:
    changes = data.model_dump(exclude_unset=True)
    if user_id == admin.id and changes.get("role") not in (None, admin.role):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Нельзя изменить собственную роль"
        )

    try:
        user = await user_service.update_user(db, user_id, changes)
    except EmailAlreadyUsed:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Такая почта уже зарегистрирована"
        ) from None

    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")
    return UserResponse.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db: Db, admin: AdminUser) -> None:
    if user_id == admin.id:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Нельзя удалить собственный аккаунт"
        )

    if not await user_service.delete_user(db, user_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")
