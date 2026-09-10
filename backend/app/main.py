import asyncio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import settings
from app.db import SessionLocal
from app.services import notification as notification_service
from app.services import user as user_service

logger = logging.getLogger(__name__)

# Мерзім ескертпелерін тексеру аралығы.
REMINDER_INTERVAL_SECONDS = 60 * 60


async def _reminder_loop() -> None:
    """Фондық цикл: мерзімі жақындаған тапсырмалар туралы ескерту жібереді."""
    while True:
        try:
            async with SessionLocal() as db:
                sent = await notification_service.send_due_reminders(db)
            if sent:
                logger.info("Ескерту жіберілді: %s тапсырма", sent)
        except Exception:  # noqa: BLE001 — цикл құламауы керек
            logger.exception("Ескерту жіберу сәтсіз аяқталды")
        await asyncio.sleep(REMINDER_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    async with SessionLocal() as db:
        await user_service.ensure_admins(db, settings.admin_emails)

    reminders = asyncio.create_task(_reminder_loop())
    try:
        yield
    finally:
        # Тоқтатқан соң күтеміз — әйтпесе логқа CancelledError шығады.
        reminders.cancel()
        with suppress(asyncio.CancelledError):
            await reminders


app = FastAPI(title="Gradebook API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
