# Gradebook

Оқытушыға арналған LMS: топтар, дисциплиналар, тапсырмалар, тестілеу,
тексеру, бағалар журналы, статистика.

## Стек

| Қабат    | Технология                                             |
| -------- | ------------------------------------------------------ |
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4         |
| Backend  | FastAPI + SQLAlchemy 2.0 (async) + Pydantic v2         |
| БД       | PostgreSQL 18 (asyncpg), миграциялар — Alembic         |

## Құрылым

```
backend/
  app/
    main.py          # FastAPI app, CORS, /health
    config.py        # Settings (.env)
    db.py            # engine, SessionLocal, Base, get_db
    api/router.py    # барлық роутерлер осында тіркеледі
    models/          # SQLAlchemy модельдері
    schemas/         # Pydantic сұраныс/жауап схемалары
    services/        # бизнес-логика (роутерлер жұқа болуы керек)
  migrations/        # Alembic
frontend/
  src/
    App.tsx
    lib/api.ts       # fetch wrapper
    components/      # қайта қолданылатын UI
    pages/           # экрандар
```

## Командалар

```bash
# БД: локалды PostgreSQL 18 (Windows сервисі, әрқашан қосулы)
# psql PATH-та жоқ, толық жолы:
#   "C:/Program Files/PostgreSQL/18/bin/psql.exe" -U postgres

# Backend (backend/ ішінен)
.venv/Scripts/python.exe -m uvicorn app.main:app --reload   # http://localhost:8000
.venv/Scripts/python.exe -m alembic revision --autogenerate -m "atauy"
.venv/Scripts/python.exe -m alembic upgrade head

# Frontend (frontend/ ішінен)
npm run dev      # http://localhost:5173
npm run build
```

## Конвенциялар

- **Backend**: роутер → сервис → модель. Роутерде тек валидация мен шақыру.
  Барлық DB қатынасы `async`, сессия `Depends(get_db)` арқылы.
- Жаңа модель қосқан соң `app/models/__init__.py` ішіне импорттау керек —
  әйтпесе Alembic autogenerate оны көрмейді.
- **Frontend**: барлық HTTP `src/lib/api.ts` арқылы. Компонент — функционалды,
  `default export` тек `pages/` ішінде.
- **Тіл**: UI мәтіні — орысша, код пен коммит — ағылшынша, түсініктемелер — қазақша.
- **Стиль**: минимализм. Ақшыл фон, аз көлеңке, аз түс, артық анимация жоқ.
- **Дизайн жүйесі** (`src/index.css` ішіндегі `@theme`):
  `--color-ink #343434` (мәтін, түйме, активті меню) · `--color-line #D2D2D2` (жиек) ·
  `--color-canvas #FBFBFB` (бет фоны) · `--color-surface #FFFFFF` (карточка) ·
  `--color-muted #6B6B6B` (әлсіз мәтін — контраст үшін қосылған бесінші реңк).
  Tailwind олардан `bg-ink`, `text-muted`, `border-line` сияқты кластар жасайды.
- **Қаріп** — General Sans (Fontshare CDN, `index.html`), 400–700. `--font-sans`.
- **Бет құрылымы**: барлық ішкі бет `Layout`-қа оралады — жоғарыда жабысқақ
  header (сол жақта логотип, оң жақта навигация мен профиль аватары), астында
  бет тақырыбы мен `Card` блоктары. Форма — өз карточкасында, тізім — `flush`
  карточкада `divide-y` арқылы, бос тізімге `Empty`. Контент ені — `max-w-5xl`.
- Эмодзи иконка ретінде қолданылмайды — тек inline SVG.
- `index.css` ішіндегі base қабатта: түймелерге `cursor: pointer`,
  `:focus-visible` контуры, `prefers-reduced-motion` құрметтелуі.

## Рөлдер

`admin` · `teacher` · `student` — бір `User` моделі + `role` өрісі
(`app/roles.py` ішіндегі `Role` литералы).

- Тіркелгенде әдепкі рөл — `student`.
- Бірінші admin `.env` арқылы беріледі: `ADMIN_EMAILS=["..."]` — сервер іске
  қосылғанда (`lifespan`) сол пошталарға admin рөлі қойылады.
- Роутерді рөлмен қорғау: `Depends(require_role(ADMIN, TEACHER))` (`app/api/deps.py`).
- Admin эндпоинттері: `GET/POST /api/users`, `PATCH /api/users/{id}`
  (пошта, ФИО, рөл, пароль — тек жіберілген өрістер), `DELETE /api/users/{id}`.
  Admin өз рөлін өзгерте де, өзін өшіре де алмайды.
- **Маңызды**: `/users/me` роуттары `/{user_id}` үлгісінен БҰРЫН тіркелуі керек,
  әйтпесе FastAPI «me» дегенді id ретінде оқиды.
- `GET /api/users/me` — кез келген аутентификацияланған пайдаланушы.
- `PATCH /api/users/me` — өз профилі: ФИО тұтас бір `full_name` өрісіне жазылады
  (бос жол — `NULL`). Frontend-те `/profile` беті.

## Топтар

- `GET/POST /api/groups`, `GET/PATCH/DELETE /api/groups/{id}`,
  `POST /api/groups/{id}/students`, `DELETE /api/groups/{id}/students/{student_id}`
- Admin барлық топты көреді, преподаватель — тек өзінікін (`Group.teacher_id`).
- Топ жасағанда преподавательді admin таңдайды; teacher өзіне ғана топ аша алады.
- Топқа тек `student` рөліндегі, бұрыннан тіркелген пайдаланушы қосылады.
  Аккаунттар admin-нің «Пользователи» бетінде ғана құрылады.
- `GET /api/users?role=student` — преподавательге де ашық (топқа қосу үшін);
  фильтрсіз немесе басқа рөлмен сұрау тек admin-ге рұқсат.
- `group_members` — Table (composite PK), `Group.students` — `secondary` relationship
  (`lazy="selectin"`), сондықтан жауапта студенттер бірден келеді.

## Auth

- `POST /api/auth/register` · `login` · `forgot-password` · `reset-password` · `GET /me`
- Пароль — bcrypt. Токен — JWT (HS256), `Authorization: Bearer <token>`.
- Токен payload-ында `ph` — ағымдағы пароль хэшінің саусақ ізі. Пароль ауысқанда
  барлық ескі токендер (сессиялар да, сброс сілтемелері де) автоматты түрде жарамсыз болады.
- Frontend токенді `localStorage`-та сақтайды (`src/lib/auth.ts`), оны
  `src/lib/api.ts` әр сұранысқа өзі қосады.
- **Пароль сбросы — поштаға 6 цифрлы код.** Код `password_reset_codes` кестесінде
  sha256 хэшімен сақталады: 15 минут жарамды, 5 әрекет, бір реттік, жаңа код
  сұралса ескісі бірден жойылады.
- Пошта `app/services/email.py` арқылы (stdlib `smtplib`). `.env` ішінде
  `SMTP_HOST` бос болса, хат жіберілмей, код серверлогына жазылады — дев режимі.

## Дисциплиналар

- `Course` → `Topic` → `Assignment` / `Test`. Дисциплина топтарға `course_groups`
  арқылы тағайындалады (көп-көпке), студент өз топтары арқылы көреді.
- `GET/POST /api/courses`, `GET/PATCH/DELETE /api/courses/{id}`,
  `POST /api/courses/{id}/topics`, `PATCH/DELETE /api/topics/{id}`,
  `POST /api/topics/{id}/assignments`, `GET/PATCH/DELETE /api/assignments/{id}`
- Тапсырмаға материал файлын тіркеу (тек преподаватель/admin):
  `POST /api/assignments/{id}/files` (multipart), `DELETE /api/assignments/files/{file_id}`,
  жүктеп алу — `GET /api/assignments/files/{file_id}` (курсты көретін кез келген адам).
  Сақтау `app/services/storage.py` арқылы, тапсыру файлдарымен бірдей шектеулер.
- `GET /api/courses/{id}` — толық ағаш (тақырыптар + тапсырмалар + тестілер).

## Тапсыру мен тексеру

- `Submission` (студент × тапсырма) → `SubmissionVersion` (әр әрекет) → `SubmissionFile`.
  Күйлері: `submitted` · `reviewed` · `revision`. Жазба жоқ болса — «Не сдано».
- `POST /api/assignments/{id}/submit` — multipart (мәтін, сілтеме, файлдар),
  әр жіберу жаңа нұсқа жасайды, тарих сақталады.
- `POST /api/assignments/submissions/{id}/review` — балл, пікір, `send_back`.
- Файлдар `backend/uploads/` ішінде, жүктеу `GET /api/files/{id}` арқылы
  (тек өз жұмысы, курс иесі немесе admin).
- **Ескерту**: `db.expire_all()` қолданбау керек — сессиядағы басқа объектілер
  құлайды. Тек нақты жазбаны `db.expire(obj)` етіп, қайта `select` жасаңыз.

## Тестілер

- `Test` → `Question` → `Option`, өту нәтижесі `TestAttempt` → `TestAnswer`.
- Сұрақ түрлері: `single` · `multiple` · `true_false` · `match` · `short`
  (`app/models/test.py`). Автотексеру — `app/services/test.py::_check`.
- Таймер, әрекет саны, сұрақ/нұсқа араластыру, нәтижені бірден көрсету — тест
  параметрлерінде. Араластыру `attempt.id` тұқымымен, сондықтан бір әрекетте
  тұрақты.

## Журнал, статистика, экспорт

- `GET /api/courses/{id}/gradebook` — студенттер × тапсырмалар + орташа балл.
- `GET /api/courses/{id}/stats` — тапсырғандар, үлгерім, рейтинг, ең қиын тапсырмалар.
- `GET /api/courses/{id}/gradebook.xlsx` — Excel (openpyxl): «Журнал»,
  «Ведомость» (жинақ балл, үлгерім %) және «Студенты» (топтар бойынша тізім) парақтары.
- Графиктер `pages/Gradebook.tsx` ішінде — тапсырма бойынша орташа балл мен
  бағалар таралуы, журнал деректерінен есептеледі (қосымша кітапханасыз).

## Уведомлениялар

- `Notification` кестесі, `GET /api/notifications`, `POST /api/notifications/read`.
- Жіберілетін сәттер: жаңа тапсырма/тест (студенттерге), жұмыс тапсырылды
  (преподавательге), тексерілді немесе доработкаға қайтарылды (студентке).
- **Мерзім ескертпесі**: `main.py` ішіндегі фондық цикл сағат сайын
  `notification.send_due_reminders()` шақырады — мерзімі 24 сағаттан аз қалған
  тапсырма бойынша тапсырмаған студенттерге «Завтра заканчивается срок сдачи»,
  преподавательге тапсырмағандар саны жіберіледі. Қайталанбауы үшін
  `Assignment.reminded_at` белгіленеді.

## Кесте

- `Lesson` (дисциплина + топ + апта күні + уақыт + аудитория).
- Дисциплина сол топқа тағайындалмаса, сабақ қосылмайды.

## Roadmap (ТЗ бойынша)

1. ~~Auth: тіркелу/кіру (JWT), пароль сбросы~~ ✅
2. ~~Үш рөл: admin/teacher/student, пайдаланушыларды басқару~~ ✅
3. ~~Топтар мен студенттер~~ ✅
4. ~~Дисциплиналар → тақырыптар → тапсырмалар~~ ✅
5. ~~Тапсырма тапсыру (файл, мәтін, сілтеме), нұсқалар тарихы~~ ✅
6. ~~Тексеру: балл, комментарий, «доработкаға» қайтару~~ ✅
7. ~~Тестілер: сұрақ түрлері, таймер, әрекет саны, автотексеру~~ ✅
8. ~~Бағалар журналы + орташа балл~~ ✅
9. ~~Уведомлениялар~~ ✅
10. ~~Статистика~~ ✅ (графиктермен)
11. ~~Excel экспорт~~ ✅
12. ~~Сабақ кестесі~~ ✅
13. ~~«Мерзім ертең бітеді» ескертпесі (фондық цикл)~~ ✅
14. ~~Тапсырмаға файл тіркеу~~ ✅

## Деплой

- Neon (БД) + Render (backend, `render.yaml`) + Netlify (frontend, `netlify.toml`).
  Толық нұсқаулық — `DEPLOY.md`.
- `DATABASE_URL` кез келген түрде берілуі мүмкін: `app/config.py` ішіндегі
  валидатор схеманы `postgresql+asyncpg` етеді, `sslmode`/`channel_binding`
  параметрлерін алып тастайды, Neon pooler хосты үшін prepared statement кэшін
  өшіреді. SSL пен `statement_cache_size` — `settings.db_connect_args` арқылы.
- `UPLOAD_DIR` баптаудан оқылады. **Render free-де диск уақытша** — файлдар
  әр деплойда өшеді, тұрақты диск немесе бұлттық сақтау керек.

## Ескертпелер

- `.env` файлдары git-ке кірмейді, үлгісі — `.env.example`.
- Docker қолданылмайды — Postgres машинада локалды орнатылған.
