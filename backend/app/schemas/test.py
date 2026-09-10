from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserResponse


class OptionResponse(BaseModel):
    """Студентке көрінетін нұсқа — дұрыс жауап жасырылады."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str


class OptionFullResponse(OptionResponse):
    is_correct: bool
    match_text: str | None


class QuestionResponse(BaseModel):
    id: int
    kind: str
    text: str
    points: int
    options: list[OptionResponse]
    # «Сәйкестік» түрі үшін оң жақ бағанның араластырылған нұсқалары.
    match_targets: list[str] = []


class QuestionFullResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kind: str
    text: str
    position: int
    points: int
    options: list[OptionFullResponse]


class TestBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    topic_id: int
    title: str
    description: str | None
    time_limit_minutes: int | None
    attempts_allowed: int
    due_at: datetime | None


class TestFullResponse(TestBrief):
    shuffle_questions: bool
    shuffle_options: bool
    show_result: bool
    questions: list[QuestionFullResponse]
    max_score: int


class TestTakeResponse(BaseModel):
    """Тест өту режимі: жауаптарсыз, қажет болса араластырылған."""

    id: int
    title: str
    description: str | None
    attempt_id: int
    deadline: datetime | None
    show_result: bool
    max_score: int
    questions: list[QuestionResponse]


class OptionInput(BaseModel):
    text: str = Field(min_length=1)
    is_correct: bool = False
    match_text: str | None = None


class CreateTestRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    time_limit_minutes: int | None = Field(default=None, ge=1, le=600)
    attempts_allowed: int = Field(default=1, ge=1, le=20)
    shuffle_questions: bool = False
    shuffle_options: bool = False
    show_result: bool = True
    due_at: datetime | None = None


class UpdateTestRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    time_limit_minutes: int | None = Field(default=None, ge=1, le=600)
    attempts_allowed: int | None = Field(default=None, ge=1, le=20)
    shuffle_questions: bool | None = None
    shuffle_options: bool | None = None
    show_result: bool | None = None
    due_at: datetime | None = None


class CreateQuestionRequest(BaseModel):
    kind: str
    text: str = Field(min_length=1)
    points: int = Field(default=1, ge=1, le=100)
    options: list[OptionInput] = []


class UpdateQuestionRequest(BaseModel):
    kind: str | None = None
    text: str | None = Field(default=None, min_length=1)
    points: int | None = Field(default=None, ge=1, le=100)
    # Берілсе — нұсқалар толық ауыстырылады.
    options: list[OptionInput] | None = None


class AnswerInput(BaseModel):
    question_id: int
    option_id: int | None = None
    option_ids: list[int] = []
    text: str | None = None
    pairs: dict[str, str] = {}


class FinishAttemptRequest(BaseModel):
    answers: list[AnswerInput] = []


class AttemptResultResponse(BaseModel):
    id: int
    score: int
    max_score: int
    finished_at: datetime | None
    show_result: bool


class AttemptRowResponse(BaseModel):
    student: UserResponse
    attempts: int
    best_score: int | None
    max_score: int
    last_finished_at: datetime | None
