# server/app/db/disciplinas.py
from __future__ import annotations
from app.db.connection import get_pool

async def buscar_nome_por_codigo(codigo: str) -> str | None:
    """Busca o nome oficial de uma disciplina no banco de dados usando o código.
    
    Retorna o nome em string se encontrado, ou None caso não exista no banco.
    """
    # 1. Recupera o pool de conexões assíncronas do seu connection.py
    pool = await get_pool()
    
    # 2. Adquire uma conexão do pool
    async with pool.acquire() as connection:
        # Busca apenas a coluna 'nome' filtrando pelo 'codigo' único
        query = "SELECT nome FROM disciplinas WHERE codigo = $1"
        row = await connection.fetchrow(query, codigo.strip().upper())
        
        if row:
            return row["nome"]
        return None