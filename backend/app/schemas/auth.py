from pydantic import BaseModel, EmailStr, Field

# bcrypt 72 байттан ұзын парольді қабылдамайды.
Password = Field(min_length=8, max_length=72)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Password


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(max_length=72)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
    password: str = Password


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    message: str
