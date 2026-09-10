from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.user import User

# Сұрақ түрлері (ТЗ №7).
SINGLE = "single"
MULTIPLE = "multiple"
TRUE_FALSE = "true_false"
MATCH = "match"
SHORT = "short"

QUESTION_KINDS = (SINGLE, MULTIPLE, TRUE_FALSE, MATCH, SHORT)


class Test(Base):
    __tablename__ = "tests"

    id: Mapped[int] = mapped_column(primary_key=True)
    topic_id: Mapped[int] = mapped_column(
        ForeignKey("topics.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    time_limit_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    attempts_allowed: Mapped[int] = mapped_column(Integer, default=1)
    shuffle_questions: Mapped[bool] = mapped_column(Boolean, default=False)
    shuffle_options: Mapped[bool] = mapped_column(Boolean, default=False)
    show_result: Mapped[bool] = mapped_column(Boolean, default=True)
    due_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    questions: Mapped[list["Question"]] = relationship(
        back_populates="test",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="Question.position",
    )


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    test_id: Mapped[int] = mapped_column(
        ForeignKey("tests.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[str] = mapped_column(String(20), default=SINGLE)
    text: Mapped[str] = mapped_column(Text)
    position: Mapped[int] = mapped_column(Integer, default=0)
    points: Mapped[int] = mapped_column(Integer, default=1)

    test: Mapped[Test] = relationship(back_populates="questions")
    options: Mapped[list["Option"]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="Option.id",
    )


class Option(Base):
    """Жауап нұсқасы. «Сәйкестік» түрінде match_text — оң жақ баған."""

    __tablename__ = "options"

    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), index=True
    )
    text: Mapped[str] = mapped_column(Text)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    match_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    question: Mapped[Question] = relationship(back_populates="options")


class TestAttempt(Base):
    __tablename__ = "test_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    test_id: Mapped[int] = mapped_column(
        ForeignKey("tests.id", ondelete="CASCADE"), index=True
    )
    student_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    score: Mapped[int] = mapped_column(Integer, default=0)
    max_score: Mapped[int] = mapped_column(Integer, default=0)

    student: Mapped[User] = relationship(lazy="selectin")
    answers: Mapped[list["TestAnswer"]] = relationship(
        back_populates="attempt",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="TestAnswer.id",
    )


class TestAnswer(Base):
    __tablename__ = "test_answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    attempt_id: Mapped[int] = mapped_column(
        ForeignKey("test_attempts.id", ondelete="CASCADE"), index=True
    )
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE")
    )
    # Жауап JSON түрінде сақталады (түріне қарай пішіні әртүрлі).
    value: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    points: Mapped[int] = mapped_column(Integer, default=0)

    attempt: Mapped[TestAttempt] = relationship(back_populates="answers")
