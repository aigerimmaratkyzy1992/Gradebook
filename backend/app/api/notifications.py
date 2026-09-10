from datetime import datetime

from fastapi import APIRouter, status
from pydantic import BaseModel, ConfigDict

from app.api.deps import CurrentUser, Db
from app.services import notification as notification_service

router = APIRouter()


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    link: str | None
    read_at: datetime | None
    created_at: datetime


class NotificationListResponse(BaseModel):
    unread: int
    items: list[NotificationResponse]


@router.get("")
async def list_notifications(db: Db, user: CurrentUser) -> NotificationListResponse:
    items = await notification_service.list_for(db, user.id)
    return NotificationListResponse(
        unread=await notification_service.unread_count(db, user.id),
        items=[NotificationResponse.model_validate(item) for item in items],
    )


@router.post("/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_read(db: Db, user: CurrentUser) -> None:
    await notification_service.mark_all_read(db, user.id)
