import uuid
from pathlib import Path

from fastapi import UploadFile

from app.config import settings

UPLOAD_DIR = Path(settings.upload_dir)
MAX_SIZE = 20 * 1024 * 1024
ALLOWED_SUFFIXES = {
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".xls",
    ".xlsx",
    ".zip",
    ".rar",
    ".7z",
    ".txt",
    ".rtf",
    ".png",
    ".jpg",
    ".jpeg",
}


class FileTooLarge(Exception):
    """Файл көлемі шектен асты."""


class FileTypeNotAllowed(Exception):
    """Мұндай кеңейтім қабылданбайды."""


async def save(file: UploadFile) -> tuple[str, int]:
    """Файлды дискіге жазып, сақталған атауы мен көлемін қайтарады."""
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise FileTypeNotAllowed

    payload = await file.read()
    if len(payload) > MAX_SIZE:
        raise FileTooLarge

    UPLOAD_DIR.mkdir(exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{suffix}"
    (UPLOAD_DIR / stored_name).write_bytes(payload)
    return stored_name, len(payload)


def path_for(stored_name: str) -> Path:
    return UPLOAD_DIR / stored_name
