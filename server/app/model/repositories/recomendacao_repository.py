from __future__ import annotations

from dataclasses import dataclass, field

from app.db.connection import get_pool


@dataclass
class DisciplinaDados:
    id_disciplina: int
    codigo: str
    nome: str
    carga_horaria: int
    tipo: str
    turno: str
    periodo_ideal: int
    prerequisitos: list[str] = field(default_factory=list)
    corequisitos: list[str] = field(default_factory=list)
    enfases: list[str] = field(default_factory=list)


_SQL_DISCIPLINAS_COM_RELACOES = """
SELECT
    d.id_disciplina,
    d.codigo,
    d.nome,
    d.carga_horaria,
    d.tipo::text AS tipo,
    d.turno,
    d.periodo_ideal,
    COALESCE(
        ARRAY_AGG(DISTINCT dp.codigo) FILTER (WHERE dp.codigo IS NOT NULL),
        ARRAY[]::varchar[]
    ) AS prerequisitos,
    COALESCE(
        ARRAY_AGG(DISTINCT dc.codigo) FILTER (WHERE dc.codigo IS NOT NULL),
        ARRAY[]::varchar[]
    ) AS corequisitos,
    COALESCE(
        ARRAY_AGG(DISTINCT e.codigo) FILTER (WHERE e.codigo IS NOT NULL),
        ARRAY[]::varchar[]
    ) AS enfases
FROM disciplinas d
LEFT JOIN disciplinas_prerequisitos pr
    ON pr.id_disciplina = d.id_disciplina
LEFT JOIN disciplinas dp
    ON dp.id_disciplina = pr.id_prerequisito
LEFT JOIN disciplinas_corequisitos cr
    ON cr.id_disciplina = d.id_disciplina
LEFT JOIN disciplinas dc
    ON dc.id_disciplina = cr.id_corequisito
LEFT JOIN disciplinas_enfases de
    ON de.id_disciplina = d.id_disciplina
LEFT JOIN enfases e
    ON e.id_enfase = de.id_enfase
GROUP BY
    d.id_disciplina, d.codigo, d.nome, d.carga_horaria, d.tipo, d.turno, d.periodo_ideal
ORDER BY d.periodo_ideal, d.tipo, d.codigo
"""

_SQL_CODIGOS = """
SELECT codigo
FROM disciplinas
ORDER BY codigo
"""


async def list_disciplinas_com_relacoes() -> list[DisciplinaDados]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(_SQL_DISCIPLINAS_COM_RELACOES)

    return [
        DisciplinaDados(
            id_disciplina=int(r["id_disciplina"]),
            codigo=str(r["codigo"]),
            nome=str(r["nome"]),
            carga_horaria=int(r["carga_horaria"]),
            tipo=str(r["tipo"]),
            turno=str(r["turno"]),
            periodo_ideal=int(r["periodo_ideal"]),
            prerequisitos=[str(x) for x in (r["prerequisitos"] or [])],
            corequisitos=[str(x) for x in (r["corequisitos"] or [])],
            enfases=[str(x) for x in (r["enfases"] or [])],
        )
        for r in rows
    ]


async def list_codigos_catalogo() -> list[str]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(_SQL_CODIGOS)
    return [str(r["codigo"]) for r in rows]
