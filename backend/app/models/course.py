from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.group import Group
from app.models.user import User

# Бір дисциплина бірнеше топта оқылуы мүмкін.
course_groups = Table(
    "course_groups",
    Base.metadata,
    Column("course_id", ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True),
    Column("group_id", ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True),
)


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    teacher_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    teacher: Mapped[User | None] = relationship(lazy="joined")
    groups: Mapped[list[Group]] = relationship(
        secondary=course_groups, lazy="selectin", order_by=Group.name
    )
    # Тақырыптар ағашы тек толық көрсетілімде керек (get_course); тізімдер мен
    # рұқсат тексерулері оны жүктемеуі үшін lazy="raise_on_sql".
    topics: Mapped[list["Topic"]] = relationship(
        back_populates="course",
        cascade="all, delete-orphan",
        lazy="raise_on_sql",
        order_by="Topic.position",
    )


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    course: Mapped[Course] = relationship(back_populates="topics")
    assignments: Mapped[list["Assignment"]] = relationship(
        back_populates="topic",
        cascade="all, delete-orphan",
        lazy="raise_on_sql",
        order_by="Assignment.id",
    )
    tests: Mapped[list["Test"]] = relationship(  # noqa: F821
        cascade="all, delete-orphan",
        lazy="raise_on_sql",
        order_by="Test.id",
    )


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(primary_key=True)
    topic_id: Mapped[int] = mapped_column(
        ForeignKey("topics.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    material_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    criteria: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    max_score: Mapped[int] = mapped_column(Integer, default=100)
    # Мерзім туралы ескерту бір рет қана жіберіледі.
    reminded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    topic: Mapped[Topic] = relationship(back_populates="assignments")
    files: Mapped[list["AssignmentFile"]] = relationship(
        back_populates="assignment",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="AssignmentFile.id",
    )


class AssignmentFile(Base):
    """Преподаватель тапсырмаға тіркеген файл."""

    __tablename__ = "assignment_files"

    id: Mapped[int] = mapped_column(primary_key=True)
    assignment_id: Mapped[int] = mapped_column(
        ForeignKey("assignments.id", ondelete="CASCADE"), index=True
    )
    filename: Mapped[str] = mapped_column(String(255))
    stored_name: Mapped[str] = mapped_column(String(255))
    size: Mapped[int] = mapped_column(Integer, default=0)

    assignment: Mapped[Assignment] = relationship(back_populates="files")
