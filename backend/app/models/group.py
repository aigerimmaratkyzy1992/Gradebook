from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Table, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.user import User

group_members = Table(
    "group_members",
    Base.metadata,
    Column("group_id", ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True),
    Column("student_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    teacher_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    teacher: Mapped[User | None] = relationship(lazy="selectin")
    students: Mapped[list[User]] = relationship(
        secondary=group_members, lazy="selectin", order_by=User.id
    )

    @property
    def students_count(self) -> int:
        return len(self.students)
