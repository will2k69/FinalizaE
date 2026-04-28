from __future__ import annotations

from typing import TypedDict

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .extractor import DisciplineRecord, extract_disciplines_from_pdf

"""
API HTTP para extracao de disciplinas a partir de historicos em PDF.

Author: José Willamys
Created: 24-04-2026
"""


class ExtractionResponse(TypedDict):
    """Formato de resposta retornado pelos endpoints de extracao."""

    total_disciplinas: int
    disciplinas: list[DisciplineRecord]


app = FastAPI(title="FinalizaE - Extrator de Historico")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    """Informa se a API esta pronta para receber requisicoes."""
    return {"status": "ok"}


@app.post("/api/extrair-historico")
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

    return {
        "total_disciplinas": len(disciplinas),
        "disciplinas": disciplinas,
    }
