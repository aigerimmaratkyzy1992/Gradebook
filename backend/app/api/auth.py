from fastapi import APIRouter, HTTPException, status

from app.api.deps import Db
from app.config import settings
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.services import auth as auth_service, email as email_service
from app.services.auth import EmailAlreadyUsed, InvalidResetCode, TooManyAttempts

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: Db) -> TokenResponse:
    try:
        user = await auth_service.register(db, data.email, data.password)
    except EmailAlreadyUsed:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Такая почта уже зарегистрирована"
        ) from None
    return TokenResponse(access_token=auth_service.create_access_token(user))


@router.post("/login")
async def login(data: LoginRequest, db: Db) -> TokenResponse:
    user = await auth_service.authenticate(db, data.email, data.password)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверная почта или пароль")
    return TokenResponse(access_token=auth_service.create_access_token(user))


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: Db) -> MessageResponse:
    user = await auth_service.get_by_email(db, data.email)

    # Пошта тіркелген-тіркелмегенін ашпаймыз: жауап әрқашан бірдей.
    if user is not None:
        code = await auth_service.create_reset_code(db, user)
        await email_service.send_reset_code(user.email, code)
    elif settings.debug:
        # Жауап әрқашан бірдей болғандықтан, дев режимде себебі логта көрінеді.
        print(f"[dev] {data.email} тіркелмеген — код жіберілмеді", flush=True)

    return MessageResponse(
        message="Если такая почта зарегистрирована, мы отправили код на неё"
    )


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: Db) -> MessageResponse:
    try:
        await auth_service.reset_password(db, data.email, data.code, data.password)
    except TooManyAttempts:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Слишком много попыток. Запросите новый код",
        ) from None
    except InvalidResetCode:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Неверный или устаревший код"
        ) from None
    return MessageResponse(message="Пароль обновлён")

