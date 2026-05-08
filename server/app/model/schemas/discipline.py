from __future__ import annotations

from pydantic import BaseModel


class DisciplineRecord(BaseModel):
    """Representa uma disciplina extraida do historico academico."""

    ano_periodo_letivo: str
    codigo_disciplina: str
    nome_disciplina: str
    hora_aula: str
    ch: str
    media: str
    situacao: str


class ExtractionResponse(BaseModel):
    """Formato de resposta retornado pelo endpoint de extracao."""

    total_disciplinas: int
    disciplinas: list[DisciplineRecord]
