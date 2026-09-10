from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserResponse


class SubmissionFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    size: int


class SubmissionVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str | None
    link: str | None
    submitted_at: datetime
    files: list[SubmissionFileResponse]


class SubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    assignment_id: int
    student: UserResponse
    status: str
    score: int | None
    comment: str | None
    reviewed_at: datetime | None
    created_at: datetime
    versions: list[SubmissionVersionResponse]


class StudentWorkResponse(BaseModel):
    """Тексеру кестесінің бір жолы: студент + жұмысы (болмауы да мүмкін)."""

    student: UserResponse
    submission: SubmissionResponse | None


class ReviewRequest(BaseModel):
    score: int | None = Field(default=None, ge=0, le=1000)
    comment: str | None = None
    # true болса — «на доработку», әйтпесе «проверено».
    send_back: bool = False
