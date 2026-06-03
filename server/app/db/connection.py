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
    url = os.getenv("DATABASE_URL")
    if url:
        print("DATABASE_URL =", url)
        return url

    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "finalizae")
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "postgres")

    dsn = f"postgresql://{user}:{password}@{host}:{port}/{name}"
    print("DSN =", dsn)
    return dsn

async def get_pool() -> Pool:
    """Retorna o pool de conexões, criando-o na primeira chamada (lazy init)."""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            host="::1",
            port=5432,
            database=os.getenv("DB_NAME", "finalizae"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "BRLASOFT107"),
            ssl=False,
        )
    return _pool


async def close_pool() -> None:
    """Fecha o pool de conexões (chamado no shutdown da aplicação)."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None

