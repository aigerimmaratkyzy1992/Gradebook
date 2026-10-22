import asyncio
import mimetypes
import uuid
from functools import cache
from pathlib import Path
from urllib.parse import quote

import boto3
from botocore.config import Config
from fastapi import UploadFile
from fastapi.responses import FileResponse, Response

from app.config import BASE_DIR, settings

# Файлдар Cloudflare R2-де сақталады (settings.has_s3). R2 бапталмаса —
# локалды дискіде: бұл тек даму үшін, Render free дискі уақытша.


def _upload_dir() -> Path:
    """Салыстырмалы жол процесс CWD-іне емес, backend/ қалтасына байланады."""
    path = Path(settings.upload_dir)
    return path if path.is_absolute() else BASE_DIR / path


UPLOAD_DIR = _upload_dir()
MAX_SIZE = 20 * 1024 * 1024
# Бөлек-бөлек оқимыз: шектен асқан файл түгел жадқа түспей тұрып тоқтатылады.
CHUNK_SIZE = 1024 * 1024
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


class FileMissing(Exception):
    """Жазба БД-да бар, бірақ файлдың өзі сақталмаған."""


@cache
def _client():  # noqa: ANN202 — boto3 клиентінің статикалық типі жоқ
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key_id,
        aws_secret_access_key=settings.s3_secret_access_key,
        region_name="auto",
        config=Config(retries={"max_attempts": 3, "mode": "standard"}),
    )


def path_for(stored_name: str) -> Path:
    return UPLOAD_DIR / stored_name


def _write_disk(stored_name: str, content: bytes) -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    path_for(stored_name).write_bytes(content)


async def save(file: UploadFile) -> tuple[str, int]:
    """Файлды сақтап, сақталған атауы мен көлемін қайтарады."""
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise FileTypeNotAllowed
    if file.size is not None and file.size > MAX_SIZE:
        raise FileTooLarge

    chunks: list[bytes] = []
    size = 0
    while chunk := await file.read(CHUNK_SIZE):
        size += len(chunk)
        if size > MAX_SIZE:
            raise FileTooLarge
        chunks.append(chunk)
    content = b"".join(chunks)

    stored_name = f"{uuid.uuid4().hex}{suffix}"
    # boto3 мен диск синхронды: event loop-ты бөгемеу үшін thread-те.
    if settings.has_s3:
        await asyncio.to_thread(
            _client().put_object,
            Bucket=settings.s3_bucket,
            Key=stored_name,
            Body=content,
            ContentType=mimetypes.guess_type(stored_name)[0] or "application/octet-stream",
        )
    else:
        await asyncio.to_thread(_write_disk, stored_name, content)
    return stored_name, size


def _read_s3(stored_name: str) -> bytes:
    client = _client()
    try:
        response = client.get_object(Bucket=settings.s3_bucket, Key=stored_name)
    except client.exceptions.NoSuchKey:
        raise FileMissing from None
    return response["Body"].read()


async def download_response(filename: str, stored_name: str) -> Response:
    """Файлды `filename` атауымен жүктеп алуға береді."""
    if not settings.has_s3:
        path = path_for(stored_name)
        if not path.exists():
            raise FileMissing
        return FileResponse(path, filename=filename)

    content = await asyncio.to_thread(_read_s3, stored_name)
    return Response(
        content,
        media_type=mimetypes.guess_type(filename)[0] or "application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename*=utf-8''{quote(filename)}"},
    )
