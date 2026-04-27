from __future__ import annotations

"""
Este módulo implementa uma API REST usando FastAPI para extrair informações de disciplinas
a partir de um arquivo PDF de histórico acadêmico. A API aceita uploads de arquivos PDF,
processa o conteúdo e retorna um JSON estruturado com as disciplinas encontradas.

Endpoints:
- GET /health: Verifica se a API está online.
- POST /api/extrair-historico: Recebe um PDF de histórico acadêmico e retorna as disciplinas extraídas em JSON.

Como usar:
1. Inicie o servidor com:
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

2. Faça o teste health da API:
   GET http://127.0.0.1:8000/health

3. Extraia disciplinas de um PDF:
   POST http://127.0.0.1:8000/api/extrair-historico
   (envie o arquivo PDF no campo 'file' do formulário)

Dependências:
- FastAPI
- pdfplumber
- Uvicorn
- python-multipart


Autor: José Willamys
Data: 24/04/2026
"""


from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .extractor import extract_disciplines_from_pdf


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
    return {"status": "ok"}


@app.post("/api/extrair-historico")
async def extrair_historico(file: UploadFile = File(...)) -> dict:
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
