import asyncio
import smtplib
from email.message import EmailMessage
from email.utils import formatdate, make_msgid

from app.config import settings


async def send_reset_code(to: str, code: str) -> None:
    """SMTP бапталмаса ғана код логқа жазылады — әйтпесе тек поштаға кетеді."""
    if not settings.smtp_host:
        print(f"[dev] сброс коды {to} үшін: {code}", flush=True)
        return

    sender = settings.smtp_from or settings.smtp_user
    message = EmailMessage()
    message["From"] = sender
    message["To"] = to
    message["Subject"] = f"Код для сброса пароля: {code}"
    message["Date"] = formatdate(localtime=True)
    # Message-ID жоқ хаттарды спам сүзгілері күдікті санайды.
    message["Message-ID"] = make_msgid(domain=settings.smtp_host.split(".", 1)[-1])
    message["Reply-To"] = sender
    message.set_content(
        f"Ваш код для сброса пароля: {code}\n\n"
        f"Код действует {settings.reset_code_ttl_minutes} минут.\n"
        "Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо."
    )

    await asyncio.to_thread(_send, message)


def _send(message: EmailMessage) -> None:
    connect = smtplib.SMTP_SSL if settings.smtp_port == 465 else smtplib.SMTP
    with connect(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
        if settings.smtp_port != 465:
            smtp.starttls()
        if settings.smtp_user:
            smtp.login(settings.smtp_user, settings.smtp_password)
        smtp.send_message(message)
