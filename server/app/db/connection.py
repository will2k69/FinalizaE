from __future__ import annotations

"""Gerenciador de conexões com o bdd.

Variáveis de ambiente aceitas (em ordem de prioridade):
  DATABASE_URL   — ex: postgresql://user:pass@host:5432/dbname
  DB_HOST        — padrão: localhost
  DB_PORT        — padrão: 5432
  DB_NAME        — ex: finalizae
  DB_USER        — padrão: postgres
  DB_PASSWORD    — ex: postgres

Author: Will
"""

import os

import asyncpg
from asyncpg.pool import Pool

_pool: Pool | None = None


def _build_dsn() -> str:
    """Constrói a DSN a partir das variáveis de ambiente."""
    url = os.getenv("DATABASE_URL")
    if url:
        return url
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "finalizae")
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "postgres")
    return f"postgresql://{user}:{password}@{host}:{port}/{name}"


async def get_pool() -> Pool:
    """Retorna o pool de conexões, criando-o na primeira chamada (lazy init)."""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(_build_dsn())
    return _pool


async def close_pool() -> None:
    """Fecha o pool de conexões (chamado no shutdown da aplicação)."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
