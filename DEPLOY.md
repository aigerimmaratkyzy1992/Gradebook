# Деплой: Neon + Render + Netlify

Үш сервис: **Neon** — PostgreSQL, **Render** — FastAPI backend,
**Netlify** — React frontend. Реті маңызды: алдымен БД, соңында CORS.

| Қабат    | Сервис  | Не керек                                  |
| -------- | ------- | ----------------------------------------- |
| БД       | Neon    | `DATABASE_URL`                            |
| Backend  | Render  | `render.yaml` (репозиторийдің түбінде)    |
| Frontend | Netlify | `netlify.toml` (репозиторийдің түбінде)   |

---

## 1. Neon — база

1. [neon.tech](https://neon.tech) → **New project**.
   Аймақ: **Europe (Frankfurt)** — Render аймағымен бірдей болғаны дұрыс.
2. **Connection string** ішінен **Direct connection** (яғни хостында
   `-pooler` жоқ) нұсқасын көшіріп ал. Түрі:

   ```
   postgresql://neondb_owner:PAROL@ep-xxx-123.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

   Сілтемені өзгертудің қажеті жоқ: қосымша `postgresql://` → `postgresql+asyncpg://`
   ауыстыруын, `sslmode`/`channel_binding` параметрлерін алып тастауды және SSL қосуды
   өзі жасайды (`app/config.py`). Pooler сілтемесі берілсе де жұмыс істейді.
3. Миграциялар Render-дің build қадамында автоматты жүреді — қолмен ештеңе қосудың
   қажеті жоқ. Локалдан жүргізгің келсе:

   ```bash
   cd backend
   DATABASE_URL="<neon сілтемесі>" .venv/Scripts/python.exe -m alembic upgrade head
   ```

---

## 2. Render — backend

1. Кодты GitHub-қа push жаса.
2. Render → **New** → **Blueprint** → репозиторийді таңда.
   `render.yaml` табылады: `gradebook-api`, free plan, Frankfurt, `rootDir: backend`.
   - build: `pip install -r requirements.txt && alembic upgrade head`
   - start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - health check: `/health`
3. `SECRET_KEY` автоматты генерацияланады. Қалған айнымалыларды дашбордта толтыр
   (**Environment** бөлімі):

   | Айнымалы           | Мәні                                                     |
   | ------------------ | -------------------------------------------------------- |
   | `DATABASE_URL`     | Neon сілтемесі                                           |
   | `CORS_ORIGINS`     | `["https://<сайт>.netlify.app"]` — 4-қадамнан кейін      |
   | `ADMIN_EMAILS`     | `["senin@mail.com"]` — бұл поштаға admin рөлі беріледі   |
   | `DEFAULT_PASSWORD` | Admin пароль сбросы қоятын стандартты пароль (8+ таңба)  |
   | `SMTP_HOST`        | мысалы `smtp.gmail.com` (бос болса — хат жіберілмейді)   |
   | `SMTP_PORT`        | `587`                                                    |
   | `SMTP_USER`        | пошта                                                    |
   | `SMTP_PASSWORD`    | қосымша паролі (Gmail App Password)                      |
   | `SMTP_FROM`        | `GradeBook <senin@mail.com>`                             |

   `DEBUG` — `false`, `PYTHON_VERSION` — `3.13.4` (`render.yaml` ішінде тұр).
4. Деплой біткен соң адресті тексер: `https://<сервис>.onrender.com/health` →
   `{"status":"ok"}`. Құжаттама: `/docs`.

---

## 3. Netlify — frontend

1. Netlify → **Add new site** → **Import an existing project** → сол репозиторий.
   `netlify.toml` бәрін өзі айтады: base `frontend`, build `npm run build`,
   publish `dist`, SPA redirect (react-router үшін міндетті).
2. **Site configuration → Environment variables**:

   | Айнымалы       | Мәні                                |
   | -------------- | ----------------------------------- |
   | `VITE_API_URL` | `https://<сервис>.onrender.com`     |

   Vite айнымалыны build кезінде «қатырып» қояды — өзгерткен соң **Redeploy** керек.
3. Сайт адресін көшір: `https://<сайт>.netlify.app`.

---

## 4. CORS — соңғы қадам

Render-дегі `CORS_ORIGINS` айнымалысына Netlify адресін жаз (соңында `/` жоқ, JSON тізім):

```
["https://gradebook.netlify.app"]
```

Сақтағанда Render өзі қайта деплой жасайды. Осыдан кейін сайт жұмыс істеуі керек.

---

## 5. Бірінші кіру

1. Netlify сайтында **Регистрация** арқылы `ADMIN_EMAILS` ішіндегі поштамен тіркел.
2. Серверді қайта іске қос (Render → **Manual Deploy** немесе кез келген деплой) —
   `lifespan` сол поштаға admin рөлін қояды.
3. Енді **Пользователи** бетінде мұғалім мен студент аккаунттарын құруға болады.

---

## Ескеру керек шектеулер

- **Жүктелген файлдар өшеді.** Render free тарифінде диск уақытша: әр деплой мен
  қайта іске қосылуда `uploads/` тазарады, яғни тапсырма файлдары мен студент
  жұмыстары жоғалады. Шешімі — ақылы instance + **Persistent Disk**
  (мысалы `/var/data`-қа қосып, `UPLOAD_DIR=/var/data/uploads` деп қою) немесе
  бұлттық сақтауға (S3, Cloudinary) көшу. Мәтін, сілтеме, баға, тест — бәрі
  Neon-да, олар жоғалмайды.
- **Free Render ұйықтап қалады**: 15 минут тыныштықтан кейін сервис тоқтайды,
  келесі сұраныс ~50 секунд күтеді. Neon compute те 5 минуттан кейін ұйықтайды.
- **Мерзім ескертпесі** (`main.py` ішіндегі фондық цикл) сервис ұйықтап тұрғанда
  жұмыс істемейді — ол келесі оянуда жалғасады.
- **Deploy Preview** адрестері `CORS_ORIGINS` ішінде болмайды, тек негізгі домен.
- `requirements.txt` нұсқалары бекітілмеген — билд қайталанымды болуы үшін
  кейін `pip freeze` арқылы бекітуге болады.
