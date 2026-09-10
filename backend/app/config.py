from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# libpq (psql, Neon сілтемесі) түсінетін, бірақ asyncpg қабылдамайтын параметрлер.
LIBPQ_ONLY_PARAMS = {"sslmode", "channel_binding", "connect_timeout"}
LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1"}


class Settings(BaseSettings):
    """Қосымша баптаулары. .env файлынан оқылады."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = (
        "postgresql+asyncpg://gradebook:gradebook@localhost:5432/gradebook"
    )
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:5174"]

    secret_key: str = "dev-secret-key-change-me-in-production-32b"
    access_token_ttl_minutes: int = 60 * 24
    reset_code_ttl_minutes: int = 15
    reset_code_max_attempts: int = 5

    debug: bool = True

    # Жүктелген файлдар қалтасы (Render-де тұрақты диск жолын беруге болады).
    upload_dir: str = "uploads"

    @field_validator("database_url")
    @classmethod
    def _asyncpg_url(cls, value: str) -> str:
        """Neon/Render беретін libpq сілтемесін asyncpg түріне келтіреді."""
        parts = urlsplit(value)
        scheme = parts.scheme
        if scheme in ("postgres", "postgresql"):
            scheme = "postgresql+asyncpg"

        query = [
            (key, item)
            for key, item in parse_qsl(parts.query)
            if key not in LIBPQ_ONLY_PARAMS
        ]
        # Neon pooler — pgbouncer, ол prepared statement-терді сақтамайды.
        if "-pooler." in (parts.hostname or ""):
            query.append(("prepared_statement_cache_size", "0"))

        return urlunsplit(
            (scheme, parts.netloc, parts.path, urlencode(query), parts.fragment)
        )

    @property
    def db_connect_args(self) -> dict[str, object]:
        """Локалды Postgres — SSL-сіз, бұлттағы БД (Neon) — әрқашан SSL-мен."""
        host = urlsplit(self.database_url).hostname or ""
        if host in LOCAL_HOSTS:
            return {}

        args: dict[str, object] = {"ssl": True}
        if "-pooler." in host:
            args["statement_cache_size"] = 0
        return args

    # Осы поштамен тіркелген пайдаланушылар admin рөлін алады.
    admin_emails: list[str] = []

    # Admin пароль сбросын жасағанда қойылатын стандартты пароль.
    default_password: str = "Gradebook2026"

    # SMTP. Бос болса — пошта жіберілмей, код серверлогына жазылады (дев режимі).
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""



settings = Settings()
