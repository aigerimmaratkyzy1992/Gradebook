from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.user import UserResponse


class GroupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    teacher: UserResponse | None
    students_count: int
    created_at: datetime


class GroupDetailResponse(GroupResponse):
    students: list[UserResponse]


class CreateGroupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    teacher_id: int | None = None


class UpdateGroupRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    teacher_id: int | None = None


class AddStudentRequest(BaseModel):
    email: EmailStr
