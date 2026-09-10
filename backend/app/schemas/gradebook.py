from pydantic import BaseModel

from app.schemas.user import UserResponse


class GradebookColumn(BaseModel):
    id: int
    title: str
    topic_title: str
    max_score: int


class GradebookCell(BaseModel):
    assignment_id: int
    score: int | None
    status: str | None


class GradebookRow(BaseModel):
    student: UserResponse
    cells: list[GradebookCell]
    average: float | None
    total: int


class GradebookResponse(BaseModel):
    columns: list[GradebookColumn]
    rows: list[GradebookRow]


class HardestAssignment(BaseModel):
    id: int
    title: str
    average_percent: float


class RankingEntry(BaseModel):
    student: UserResponse
    average: float


class CourseStatsResponse(BaseModel):
    students: int
    assignments: int
    expected: int
    submitted: int
    reviewed: int
    not_submitted: int
    average: float | None
    completion_percent: float
    hardest: list[HardestAssignment]
    ranking: list[RankingEntry]
