from datetime import time

from sqlalchemy import ForeignKey, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.course import Course
from app.models.group import Group

from app.db import Base


class Lesson(Base):
    """Сабақ кестесінің бір жолы: апта күні, уақыты, топ пен дисциплина."""

    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), index=True
    )
    group_id: Mapped[int] = mapped_column(
        ForeignKey("groups.id", ondelete="CASCADE"), index=True
    )
    # 0 — дүйсенбі … 6 — жексенбі
    weekday: Mapped[int] = mapped_column(Integer, default=0)
    starts_at: Mapped[time] = mapped_column(Time)
    ends_at: Mapped[time] = mapped_column(Time)
    room: Mapped[str | None] = mapped_column(String(50), nullable=True)

    course: Mapped[Course] = relationship(lazy="selectin")
    group: Mapped[Group] = relationship(lazy="selectin")
