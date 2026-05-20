from __future__ import annotations

"""CRUD para disciplinas. TODO: remover sqls, colcoar em procedures e chamar aqui apenas as procedures."""

import asyncpg
from asyncpg.pool import Pool

from app.model.schemas.disciplina_admin import DisciplinaCreate, DisciplinaOut, DisciplinaUpdate

_SELECT = (
    "SELECT id_disciplina, id_curso, codigo, nome, "
    "carga_horaria, tipo, turno, periodo_ideal FROM disciplinas"
)


async def list_disciplinas(pool: Pool) -> list[DisciplinaOut]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(f"{_SELECT} ORDER BY periodo_ideal, nome")
    return [DisciplinaOut(**dict(r)) for r in rows]


async def get_disciplina(pool: Pool, id_disciplina: int) -> DisciplinaOut | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(f"{_SELECT} WHERE id_disciplina = $1", id_disciplina)
    return DisciplinaOut(**dict(row)) if row else None


async def create_disciplina(pool: Pool, data: DisciplinaCreate) -> DisciplinaOut:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO disciplinas (codigo, nome, carga_horaria, tipo, turno, periodo_ideal) "
            "VALUES ($1, $2, $3, $4, $5, $6) "
            "RETURNING id_disciplina, id_curso, codigo, nome, carga_horaria, tipo, turno, periodo_ideal",
            data.codigo,
            data.nome,
            data.carga_horaria,
            data.tipo.value,
            data.turno,
            data.periodo_ideal,
        )
    return DisciplinaOut(**dict(row))  # type: ignore[arg-type]


async def update_disciplina(
    pool: Pool, id_disciplina: int, data: DisciplinaUpdate
) -> DisciplinaOut | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE disciplinas "
            "SET codigo=$1, nome=$2, carga_horaria=$3, tipo=$4, turno=$5, periodo_ideal=$6 "
            "WHERE id_disciplina=$7 "
            "RETURNING id_disciplina, id_curso, codigo, nome, carga_horaria, tipo, turno, periodo_ideal",
            data.codigo,
            data.nome,
            data.carga_horaria,
            data.tipo.value,
            data.turno,
            data.periodo_ideal,
            id_disciplina,
        )
    return DisciplinaOut(**dict(row)) if row else None


async def delete_disciplina(pool: Pool, id_disciplina: int) -> bool:
    async with pool.acquire() as conn:
        result = await conn.execute(
            "DELETE FROM disciplinas WHERE id_disciplina = $1", id_disciplina
        )
    return result == "DELETE 1"
