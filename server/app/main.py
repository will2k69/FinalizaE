from __future__ import annotations

import os
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.historico import router as historico_router
from app.api.routes.disciplinas import router as disciplinas_router
from app.api.routes.recomendacoes import router as recomendacoes_router
from app.db.connection import close_pool

"""
API HTTP do FinalizaE.

Author: José Willamys
Created: 24-04-2026
"""


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Gerencia o ciclo de vida da aplicação (startup / shutdown)."""
    yield
    await close_pool()


app = FastAPI(title="FinalizaE API", lifespan=lifespan)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500")
_allowed_origins = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(historico_router)
app.include_router(disciplinas_router)
app.include_router(recomendacoes_router)


@app.get("/health")
async def health() -> dict[str, str]:
    """Informa se a API esta pronta para receber requisicoes."""
    return {"status": "ok"}
