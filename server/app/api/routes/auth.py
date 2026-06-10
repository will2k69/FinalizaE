from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import bcrypt

from app.db.connection import get_pool

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginData(BaseModel):
    email: str
    senha: str


@router.post("/login")
async def login(data: LoginData):
    pool = await get_pool()

    usuario = await pool.fetchrow(
        "SELECT id_admin, email, senha_hash, nome FROM usuarios_admin WHERE email = $1 AND ativo = TRUE",
        data.email,
    )

    if usuario is None or not bcrypt.checkpw(data.senha.encode(), usuario["senha_hash"].encode()):
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")

    await pool.execute(
        "UPDATE usuarios_admin SET ultimo_acesso = NOW() WHERE id_admin = $1",
        usuario["id_admin"],
    )

    return {
        "access_token": "autenticado",
        "usuario": {"nome": usuario["nome"], "email": usuario["email"]},
    }