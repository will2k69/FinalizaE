DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'tipo_disciplina'
    ) THEN
        CREATE TYPE tipo_disciplina AS ENUM ('obrigatoria', 'eletiva');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS disciplinas (
    id_disciplina SERIAL PRIMARY KEY,
    id_curso INTEGER,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    carga_horaria SMALLINT NOT NULL CHECK (carga_horaria > 0),
    tipo tipo_disciplina NOT NULL DEFAULT 'obrigatoria',
    turno CHAR(1) NOT NULL CHECK (turno IN ('M', 'T')),
    periodo_ideal SMALLINT NOT NULL CHECK (periodo_ideal >= 1)
);

CREATE INDEX IF NOT EXISTS idx_disciplinas_codigo ON disciplinas (codigo);
CREATE INDEX IF NOT EXISTS idx_disciplinas_nome ON disciplinas (nome);

/* integracao códigos disciplinas */ 

async def buscar_nome_por_codigo(codigo: str) -> str | None:
    """Busca o nome oficial de uma disciplina no banco de dados usando o código.
    
    Retorna o nome em string se encontrado, ou None caso não exista no banco.
    """
    pool = await get_pool()
    
    async with pool.acquire() as connection:
        # Busca apenas a coluna 'nome' filtrando pelo 'codigo' único
        query = "SELECT nome FROM disciplinas WHERE codigo = $1"
        row = await connection.fetchrow(query, codigo.strip().upper())
        
        if row:
            return row["nome"]
        return None