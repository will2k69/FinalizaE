from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.model.repositories.recomendacao_repository import list_codigos_catalogo
from app.model.schemas.recomendacao import RecomendacaoRequest, RecomendacaoResponse
from app.services.recomendacao_service import calcular_carga_minima_viavel, gerar_recomendacao

router = APIRouter(prefix="/api/recomendacoes", tags=["recomendacoes"])


@router.get("/catalogo-codigos")
async def listar_catalogo_codigos() -> dict[str, list[str]]:
    """Retorna os códigos do catálogo de disciplinas para validação do histórico."""
    return {"codigos": await list_codigos_catalogo()}


@router.post("/carga-minima")
async def calcular_carga_minima_endpoint(payload: RecomendacaoRequest) -> dict[str, int]:
    """Calcula a carga mínima por período para o aluno se formar no prazo.

    Retorna ``{"carga_minima_por_periodo": int}`` em horas.
    Raises 400 se os períodos estiverem em formato inválido.
    """
    try:
        carga_minima = await calcular_carga_minima_viavel(
            periodo_atual=payload.periodo_atual,
            prazo_conclusao=payload.prazo_conclusao,
            historico=payload.historico,
            enfase=payload.enfase.value,
            minimo_eletivas_enfase=payload.minimo_eletivas_enfase,
        )
        return {"carga_minima_por_periodo": carga_minima}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/gerar", response_model=RecomendacaoResponse)
async def gerar_recomendacao_endpoint(payload: RecomendacaoRequest) -> RecomendacaoResponse:
    """Gera o plano semestral considerando histórico, ênfase, prioridade e carga máxima.

    Raises 400 se o payload for inválido.
    """
    try:
        return await gerar_recomendacao(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
