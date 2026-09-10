from fastapi import APIRouter

from app.api import (
    auth,
    courses,
    gradebook,
    groups,
    my,
    notifications,
    schedule,
    submissions,
    tests,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(my.router, prefix="/my", tags=["my"])
api_router.include_router(schedule.router, prefix="/schedule", tags=["schedule"])
api_router.include_router(
    notifications.router, prefix="/notifications", tags=["notifications"]
)
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(groups.router, prefix="/groups", tags=["groups"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(gradebook.router, prefix="/courses", tags=["gradebook"])
api_router.include_router(courses.topics_router, prefix="/topics", tags=["courses"])
api_router.include_router(tests.topics_router, prefix="/topics", tags=["tests"])
api_router.include_router(tests.tests_router, prefix="/tests", tags=["tests"])
api_router.include_router(tests.questions_router, prefix="/questions", tags=["tests"])
api_router.include_router(tests.attempts_router, prefix="/attempts", tags=["tests"])
api_router.include_router(
    courses.assignments_router, prefix="/assignments", tags=["courses"]
)
api_router.include_router(submissions.router, prefix="/assignments", tags=["submissions"])
api_router.include_router(
    submissions.files_router, prefix="/files", tags=["submissions"]
)
