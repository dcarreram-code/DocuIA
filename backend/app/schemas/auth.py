from pydantic import BaseModel, EmailStr, Field


class RegistroUsuario(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    correo: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginUsuario(BaseModel):
    correo: EmailStr
    password: str = Field(min_length=8, max_length=128)