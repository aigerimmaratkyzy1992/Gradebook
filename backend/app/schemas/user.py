from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.roles import Role, STUDENT


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str | None
    role: Role
    created_at: datetime


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    full_name: str | None = Field(default=None, max_length=255)
    role: Role = STUDENT


class UpdateUserRequest(BaseModel):
    """Тек жіберілген өрістер өзгереді (exclude_unset)."""

    email: EmailStr | None = None
    full_name: str | None = Field(default=None, max_length=255)
    role: Role | None = None
    password: str | None = Field(default=None, min_length=8, max_length=72)


class UpdateProfileRequest(BaseModel):
    # ФИО тұтас бір өріске жазылады.
    full_name: str | None = Field(default=None, max_length=255)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(max_length=72)
    new_password: str = Field(min_length=8, max_length=72)


class ResetPasswordResponse(BaseModel):
    """Admin сброс жасағанда — жаңа стандартты пароль ашық қайтарылады."""

    user: UserResponse
    password: str
