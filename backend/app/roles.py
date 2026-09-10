from typing import Literal

Role = Literal["admin", "teacher", "student"]

ADMIN: Role = "admin"
TEACHER: Role = "teacher"
STUDENT: Role = "student"

ALL: tuple[Role, ...] = (ADMIN, TEACHER, STUDENT)
