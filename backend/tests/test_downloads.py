import io
import os
from datetime import UTC, datetime, timedelta

import httpx
import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.db import Base, get_db
from app.main import app
from app.models import (
    Assignment, AssignmentFile, Course, Group, Submission, SubmissionFile,
    SubmissionVersion, Topic, User, course_groups,
)
from app.models.group import group_members
from app.security import create_token, password_fingerprint
from app.services import storage


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def download_client(tmp_path, monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    old = datetime.now(UTC) - timedelta(days=3)
    async with sessions() as db:
        db.add_all([
            User(id=1, email="teacher@example.com", password_hash="hash", role="teacher"),
            User(id=2, email="student@example.com", password_hash="hash", role="student"),
            User(id=3, email="other@example.com", password_hash="hash", role="student"),
            User(id=4, email="admin@example.com", password_hash="hash", role="admin"),
        ])
        await db.flush()
        db.add(Group(id=1, name="Group", teacher_id=1))
        db.add(Course(id=1, name="Course", teacher_id=1))
        await db.flush()
        await db.execute(group_members.insert().values(group_id=1, student_id=2))
        await db.execute(course_groups.insert().values(course_id=1, group_id=1))
        db.add(Topic(id=1, course_id=1, title="Topic"))
        await db.flush()
        db.add(Assignment(id=1, topic_id=1, title="Old assignment", created_at=old, due_at=old))
        await db.flush()
        db.add(AssignmentFile(id=1, assignment_id=1, filename="material.txt", stored_name="material.txt", size=8))
        db.add(Submission(id=1, assignment_id=1, student_id=2, created_at=old))
        await db.flush()
        db.add(SubmissionVersion(id=1, submission_id=1, submitted_at=old))
        await db.flush()
        db.add(SubmissionFile(id=1, version_id=1, filename="answer.txt", stored_name="answer.txt", size=6))
        await db.commit()

    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir()
    for name, content in [("material.txt", b"material"), ("answer.txt", b"answer")]:
        path = upload_dir / name
        path.write_bytes(content)
        os.utime(path, (old.timestamp(), old.timestamp()))
    monkeypatch.setattr(storage, "UPLOAD_DIR", upload_dir)
    launch_dir = tmp_path / "different-launch-directory"
    launch_dir.mkdir()
    monkeypatch.chdir(launch_dir)

    async def test_db():
        async with sessions() as db:
            yield db

    app.dependency_overrides[get_db] = test_db
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            yield client, upload_dir
    finally:
        app.dependency_overrides.clear()
        await engine.dispose()


def authorization(user_id, *, is_expired=False):
    ttl = timedelta(minutes=-1 if is_expired else 10)
    token = create_token(str(user_id), ttl, ph=password_fingerprint("hash"))
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.anyio
@pytest.mark.parametrize("user_id", [1, 2, 4])
@pytest.mark.parametrize("path,content", [("/api/assignments/files/1", b"material"), ("/api/files/1", b"answer")])
async def test_old_files_remain_downloadable(download_client, user_id, path, content):
    client, _ = download_client
    response = await client.get(path, headers=authorization(user_id))
    assert response.status_code == 200
    assert response.content == content
    assert "attachment" in response.headers["content-disposition"]


@pytest.mark.anyio
@pytest.mark.parametrize("path", ["/api/assignments/files/1", "/api/files/1"])
async def test_download_access_and_missing_file(download_client, path):
    client, upload_dir = download_client
    assert (await client.get(path)).status_code == 401
    assert (await client.get(path, headers=authorization(2, is_expired=True))).status_code == 401
    assert (await client.get(path, headers=authorization(3))).status_code == 403
    assert (await client.get(path.replace("/1", "/999"), headers=authorization(2))).status_code == 404
    for file in upload_dir.iterdir():
        file.unlink()
    response = await client.get(path, headers=authorization(2))
    assert response.status_code == 404
    assert response.json()["detail"] == "Файл не сохранился на сервере — загрузите его заново"


class FakeBucket:
    """R2 орнына: put_object/get_object жадта."""

    def __init__(self):
        self.objects: dict[str, bytes] = {}
        self.exceptions = type("Exceptions", (), {"NoSuchKey": KeyError})

    def put_object(self, *, Bucket, Key, Body, ContentType):
        self.objects[Key] = Body

    def get_object(self, *, Bucket, Key):
        return {"Body": io.BytesIO(self.objects[Key])}


@pytest.mark.anyio
async def test_files_are_stored_in_r2_and_survive_wiped_disk(download_client, monkeypatch):
    client, upload_dir = download_client
    bucket = FakeBucket()
    monkeypatch.setattr(storage.settings, "s3_endpoint_url", "https://r2.example")
    monkeypatch.setattr(storage.settings, "s3_bucket", "gradebook-files")
    monkeypatch.setattr(storage, "_client", lambda: bucket)

    response = await client.post(
        "/api/assignments/1/files",
        headers=authorization(1),
        files=[("files", ("Тапсырма.pdf", b"%PDF-material", "application/pdf"))],
    )
    assert response.status_code == 201
    file_id = max(file["id"] for file in response.json()["files"])
    response = await client.post(
        "/api/assignments/1/submit",
        headers=authorization(2),
        files=[("files", ("answer.docx", b"docx-answer", "application/octet-stream"))],
    )
    assert response.status_code == 201
    answer_id = max(f["id"] for v in response.json()["versions"] for f in v["files"])
    assert len(bucket.objects) == 2

    for file in upload_dir.iterdir():
        file.unlink()
    response = await client.get(f"/api/assignments/files/{file_id}", headers=authorization(2))
    assert response.status_code == 200
    assert response.content == b"%PDF-material"
    assert response.headers["content-type"] == "application/pdf"
    assert "filename*=utf-8''" in response.headers["content-disposition"]
    response = await client.get(f"/api/files/{answer_id}", headers=authorization(1))
    assert response.content == b"docx-answer"

    # Ескі жазба (файлы R2-ге жүктелмеген) — түсінікті 404.
    response = await client.get("/api/files/1", headers=authorization(2))
    assert response.status_code == 404


def test_relative_upload_directory_ignores_working_directory(tmp_path, monkeypatch):
    monkeypatch.setattr(storage.settings, "upload_dir", "uploads")
    monkeypatch.chdir(tmp_path)
    assert storage._upload_dir() == storage.BASE_DIR / "uploads"


@pytest.mark.anyio
async def test_schedule_create_edit_and_delete(download_client):
    client, _ = download_client
    headers = authorization(1)
    response = await client.post("/api/schedule", headers=headers, json={
        "course_id": 1, "group_id": 1, "weekday": 0,
        "starts_at": "09:00", "ends_at": "10:00", "room": "101",
    })
    assert response.status_code == 201
    lesson_id = response.json()["id"]
    response = await client.get("/api/schedule", headers=authorization(2))
    assert [lesson["id"] for lesson in response.json()] == [lesson_id]
    assert (await client.get("/api/schedule", headers=authorization(3))).json() == []
    response = await client.patch(f"/api/schedule/{lesson_id}", headers=headers, json={"room": "202"})
    assert response.status_code == 200
    assert response.json()["room"] == "202"
    assert (await client.delete(f"/api/schedule/{lesson_id}", headers=authorization(2))).status_code == 403
    assert (await client.delete(f"/api/schedule/{lesson_id}", headers=headers)).status_code == 204
    assert (await client.get("/api/schedule", headers=headers)).json() == []
