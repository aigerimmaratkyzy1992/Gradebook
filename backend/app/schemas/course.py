from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.test import TestBrief
from app.schemas.user import UserResponse


class GroupBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class AssignmentFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    size: int


class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    topic_id: int
    title: str
    description: str | None
    material_url: str | None
    criteria: str | None
    due_at: datetime | None
    max_score: int
    files: list[AssignmentFileResponse]
    created_at: datetime


class AssignmentDetailResponse(AssignmentResponse):
    topic_title: str
    course_id: int
    course_name: str


class TopicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    title: str
    position: int
    assignments: list[AssignmentResponse]
    tests: list[TestBrief]


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    teacher: UserResponse | None
    groups: list[GroupBrief]
    created_at: datetime


class CourseDetailResponse(CourseResponse):
    topics: list[TopicResponse]


class CreateCourseRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    teacher_id: int | None = None
    group_ids: list[int] = []


class UpdateCourseRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    teacher_id: int | None = None
    group_ids: list[int] | None = None


class CreateTopicRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class UpdateTopicRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    position: int | None = None


class CreateAssignmentRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    material_url: str | None = Field(default=None, max_length=500)
    criteria: str | None = None
    due_at: datetime | None = None
    max_score: int = Field(default=100, ge=1, le=1000)


class UpdateAssignmentRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    material_url: str | None = Field(default=None, max_length=500)
    criteria: str | None = None
    due_at: datetime | None = None
    max_score: int | None = Field(default=None, ge=1, le=1000)
