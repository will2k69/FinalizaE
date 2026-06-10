from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class TipoDisciplina(str, Enum):
    obrigatoria = "obrigatoria"
    eletiva = "eletiva"
    outros = "outros"


class DisciplinaBase(BaseModel):
    codigo: str = Field(..., max_length=20)
    nome: str = Field(..., max_length=255)
    carga_horaria: int = Field(..., gt=0, description="Em horas (ex: 60, 72)")
    tipo: TipoDisciplina
    turno: str = Field(..., pattern="^[MTN]$", description="M=Manhã | T=Tarde | N=Noturno")
    periodo_ideal: int = Field(..., ge=1, description="Semestre recomendado (1, 2, 3...)")


class DisciplinaCreate(DisciplinaBase):
    """Payload para criação de uma disciplina."""


class DisciplinaUpdate(DisciplinaBase):
    """Payload para atualização de uma disciplina."""


class DisciplinaOut(DisciplinaBase):
    """Disciplina retornada pela API."""

    id_disciplina: int
    id_curso: int | None = None

    model_config = {"from_attributes": True}
