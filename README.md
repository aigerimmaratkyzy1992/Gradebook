# Gradebook

Оқытушыға арналған LMS: топтар, тапсырмалар, тестілер, бағалар журналы.

**Стек:** React + TypeScript + Vite + Tailwind · FastAPI + SQLAlchemy (async) · PostgreSQL

## Іске қосу

```bash
# 1. БД — локалды PostgreSQL 18 (Windows сервисі ретінде жүреді), бір рет жасау:
"C:/Program Files/PostgreSQL/18/bin/psql.exe" -U postgres -c "CREATE DATABASE gradebook"

# 2. Backend (backend/ ішінен) — http://localhost:8000/docs
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
cp .env.example .env
.venv/Scripts/python.exe -m uvicorn app.main:app --reload

# 3. Frontend (frontend/ ішінен) — http://localhost:5173
npm install
cp .env.example .env
npm run dev
```

Жоба құрылымы мен конвенциялар — [CLAUDE.md](CLAUDE.md).
