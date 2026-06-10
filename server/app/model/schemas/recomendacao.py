from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field, field_validator


class TipoEnfase(str, Enum):
    computacao_visual = "computacao_visual"
    sistemas_inteligentes = "sistemas_inteligentes"
    sistemas_computacao = "sistemas_computacao"
    sistemas_informacao = "sistemas_informacao"


class TipoPrioridade(str, Enum):
    obrigatorias = "obrigatorias"
    eletivas = "eletivas"


class DisciplinaCursadaIn(BaseModel):
    codigo: str = Field(..., min_length=3, max_length=20)
    nota: float = Field(..., ge=0.0, le=10.0)
    status: str = Field(
        default="concluida",
        description="concluida ou cursando; apenas concluida com nota >= 7 libera prerequisito",
    )

    @field_validator("codigo")
    @classmethod
    def normalize_codigo(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("status")
    @classmethod
    def normalize_status(cls, value: str) -> str:
        status = value.strip().lower()
        if status not in {"concluida", "cursando"}:
            raise ValueError("status deve ser 'concluida' ou 'cursando'")
        return status


class RecomendacaoRequest(BaseModel):
    enfase: TipoEnfase
    prazo_conclusao: str = Field(..., description="Formato AAAA.S, exemplo: 2028.1")
    periodo_atual: str = Field(..., description="Formato AAAA.S, exemplo: 2026.1")
    carga_horaria_max_por_periodo: int = Field(default=420, ge=72, le=576)
    prioridade: TipoPrioridade = Field(default=TipoPrioridade.obrigatorias)
    minimo_eletivas_enfase: int = Field(default=5, ge=0, le=12)
    historico: list[DisciplinaCursadaIn] = Field(default_factory=list)

    @field_validator("prazo_conclusao", "periodo_atual")
    @classmethod
    def validar_periodo(cls, value: str) -> str:
        raw = value.strip()
        if len(raw) != 6 or raw[4] != "." or raw[5] not in {"1", "2"}:
            raise ValueError("periodo deve estar no formato AAAA.S (S = 1 ou 2)")
        ano = raw[:4]
        if not ano.isdigit():
            raise ValueError("ano do periodo deve ser numerico")
        return raw


class DisciplinaRecomendadaOut(BaseModel):
    codigo: str
    nome: str
    carga_horaria: int
    tipo: str
    turno: str
    periodo_ideal: int
    prioridade_enfase: bool
    prerequisitos_pendentes: list[str] = Field(default_factory=list)


class PeriodoPlanoOut(BaseModel):
    periodo: str
    carga_horaria_total: int
    disciplinas: list[DisciplinaRecomendadaOut]


class PendenciaOut(BaseModel):
    codigo: str
    nome: str
    motivo: str


class RecomendacaoResponse(BaseModel):
    enfase: TipoEnfase
    periodo_atual: str
    prazo_conclusao: str
    periodos_planejados: list[PeriodoPlanoOut]
    pendencias: list[PendenciaOut]
