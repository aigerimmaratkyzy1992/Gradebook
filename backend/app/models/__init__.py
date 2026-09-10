"""ORM модельдері. Alembic автогенерациясы үшін бәрі осында импортталады."""

from app.db import Base
from app.models.course import (
    Assignment,
    AssignmentFile,
    Course,
    Topic,
    course_groups,
)
from app.models.group import Group, group_members
from app.models.lesson import Lesson
from app.models.notification import Notification
from app.models.password_reset import PasswordResetCode
from app.models.submission import (
    Submission,
    SubmissionFile,
    SubmissionVersion,
)
from app.models.test import (
    Option,
    Question,
    Test,
    TestAnswer,
    TestAttempt,
)
from app.models.user import User

__all__ = [
    "Assignment",
    "AssignmentFile",
    "Base",
    "Course",
    "Group",
    "Lesson",
    "Notification",
    "Option",
    "Question",
    "PasswordResetCode",
    "Submission",
    "SubmissionFile",
    "SubmissionVersion",
    "Test",
    "TestAnswer",
    "TestAttempt",
    "Topic",
    "User",
    "course_groups",
    "group_members",
]
