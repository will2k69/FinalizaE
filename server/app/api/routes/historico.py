from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.model.schemas.discipline import ExtractionResponse
from app.services.extraction_service import extract_disciplines_from_pdf

router = APIRouter(prefix="/api", tags=["historico"])


@router.post("/extrair-historico", response_model=ExtractionResponse)
async def extrair_historico(file: UploadFile = File(...)) -> ExtractionResponse:
    """Extrai disciplinas do PDF enviado pelo cliente."""
    if file.content_type not in {"application/pdf", "application/octet-stream"}:
        raise HTTPException(status_code=400, detail="Envie um arquivo PDF valido.")

    pdf_bytes = await file.read()
    disciplinas = extract_disciplines_from_pdf(pdf_bytes)

    if not disciplinas:
        raise HTTPException(
            status_code=422,
            detail=(
                "Nao foi possivel extrair disciplinas do PDF. "
                "Confirme se o historico segue o modelo padrao da universidade."
            ),
        )

    return ExtractionResponse(
        total_disciplinas=len(disciplinas),
        disciplinas=disciplinas,
    )
