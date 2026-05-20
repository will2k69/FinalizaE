from __future__ import annotations

from fastapi import APIRouter, HTTPException, Response

import asyncpg

from app.db.connection import get_pool
from app.model.repositories.disciplina_repository import (
    create_disciplina,
    delete_disciplina,
    get_disciplina,
    list_disciplinas,
    update_disciplina,
)
from app.model.schemas.disciplina_admin import DisciplinaCreate, DisciplinaOut, DisciplinaUpdate

router = APIRouter(prefix="/api/disciplinas", tags=["disciplinas"])


@router.get("/", response_model=list[DisciplinaOut])
async def listar_disciplinas() -> list[DisciplinaOut]:
    pool = await get_pool()
    return await list_disciplinas(pool)


@router.get("/{id_disciplina}", response_model=DisciplinaOut)
async def obter_disciplina(id_disciplina: int) -> DisciplinaOut:
    pool = await get_pool()
    disc = await get_disciplina(pool, id_disciplina)
    if disc is None:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada.")
    return disc


@router.post("/", response_model=DisciplinaOut, status_code=201)
async def cadastrar_disciplina(data: DisciplinaCreate) -> DisciplinaOut:
    pool = await get_pool()
    try:
        return await create_disciplina(pool, data)
    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=409, detail=f"Já existe uma disciplina com o código '{data.codigo}'.")


@router.put("/{id_disciplina}", response_model=DisciplinaOut)
async def atualizar_disciplina(id_disciplina: int, data: DisciplinaUpdate) -> DisciplinaOut:
    pool = await get_pool()
    try:
        disc = await update_disciplina(pool, id_disciplina, data)
    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=409, detail=f"Já existe uma disciplina com o código '{data.codigo}'.")
    if disc is None:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada.")
    return disc


@router.delete("/{id_disciplina}", status_code=204, response_class=Response)
async def remover_disciplina(id_disciplina: int) -> Response:
    pool = await get_pool()
    removed = await delete_disciplina(pool, id_disciplina)
    if not removed:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada.")
    return Response(status_code=204)
