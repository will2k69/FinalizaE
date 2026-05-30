from fastapi import APIRouter, HTTPException

from app.model.schemas.admin import LoginRequest
from app.db.connection import get_pool

router = APIRouter(prefix="/auth")


@router.post("/login")
async def login(payload: LoginRequest):

    pool = await get_pool()

    admin = await pool.fetchrow(
        """
        SELECT *
        FROM tbAdmin
        WHERE usuario = $1
        """,
        payload.usuario
    )

    if not admin:
        raise HTTPException(
            status_code=401,
            detail="Usuário ou senha inválidos"
        )

    if admin["senha_hash"] != payload.senha:
        raise HTTPException(
            status_code=401,
            detail="Usuário ou senha inválidos"
        )

    return {
        "token": "admin-logado",
        "usuario": admin["usuario"]
    }