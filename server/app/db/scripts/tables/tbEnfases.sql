CREATE TABLE IF NOT EXISTS enfases (
    id_enfase SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(120) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_enfases_codigo ON enfases (codigo);
