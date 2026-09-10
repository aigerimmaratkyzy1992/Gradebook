from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.user import User

# Жұмыс күйлері: тапсырылды → тексерілді / доработкаға қайтарылды.
SUBMITTED = "submitted"
REVIEWED = "reviewed"
REVISION = "revision"


class Submission(Base):
    """Бір студенттің бір тапсырма бойынша жұмысы (нұсқалары ішінде)."""

    __tablename__ = "submissions"
    __table_args__ = (UniqueConstraint("assignment_id", "student_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    assignment_id: Mapped[int] = mapped_column(
        ForeignKey("assignments.id", ondelete="CASCADE"), index=True
    )
    student_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[str] = mapped_column(String(20), default=SUBMITTED)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    student: Mapped[User] = relationship(lazy="selectin")
    versions: Mapped[list["SubmissionVersion"]] = relationship(
        back_populates="submission",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="SubmissionVersion.id",
    )


class SubmissionVersion(Base):
    """Тапсырудың бір әрекеті — тарих осылай сақталады."""

    __tablename__ = "submission_versions"

    id: Mapped[int] = mapped_column(primary_key=True)
    submission_id: Mapped[int] = mapped_column(
        ForeignKey("submissions.id", ondelete="CASCADE"), index=True
    )
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    submission: Mapped[Submission] = relationship(back_populates="versions")
    files: Mapped[list["SubmissionFile"]] = relationship(
        back_populates="version",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="SubmissionFile.id",
    )


class SubmissionFile(Base):
    __tablename__ = "submission_files"

    id: Mapped[int] = mapped_column(primary_key=True)
    version_id: Mapped[int] = mapped_column(
        ForeignKey("submission_versions.id", ondelete="CASCADE"), index=True
    )
    filename: Mapped[str] = mapped_column(String(255))
    stored_name: Mapped[str] = mapped_column(String(255))
    size: Mapped[int] = mapped_column(Integer, default=0)

    version: Mapped[SubmissionVersion] = relationship(back_populates="files")
