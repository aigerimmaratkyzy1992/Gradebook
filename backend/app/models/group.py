from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Table, func, select
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

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

    # many-to-one: бір JOIN, қосымша сұраныссыз.
    teacher: Mapped[User | None] = relationship(lazy="joined")
    # Студенттер өздігінен жүктелмейді (Course.groups арқылы бәрі құламауы үшін):
    # керек жерде selectinload(Group.students) беріледі.
    students: Mapped[list[User]] = relationship(
        secondary=group_members, lazy="raise_on_sql", order_by=User.id
    )
    # Студент санын студенттерді жүктемей санау үшін: undefer(Group.students_count).
    students_count: Mapped[int] = column_property(
        select(func.count(group_members.c.student_id))
        .where(group_members.c.group_id == id)
        .correlate_except(group_members)
        .scalar_subquery(),
        deferred=True,
    )
