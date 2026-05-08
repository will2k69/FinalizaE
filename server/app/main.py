from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.historico import router as historico_router

"""
API HTTP do FinalizaE.

Author: José Willamys
Created: 24-04-2026
"""

app = FastAPI(title="FinalizaE API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(historico_router)


@app.get("/health")
async def health() -> dict[str, str]:
    """Informa se a API esta pronta para receber requisicoes."""
    return {"status": "ok"}
