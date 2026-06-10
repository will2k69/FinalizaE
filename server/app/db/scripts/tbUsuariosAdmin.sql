DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'perfil_admin'
    ) THEN
        CREATE TYPE perfil_admin AS ENUM ('super_admin', 'admin');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS usuarios_admin (
    id_admin     SERIAL PRIMARY KEY,
    email        VARCHAR(255) NOT NULL UNIQUE,
    senha_hash   VARCHAR(255) NOT NULL,
    nome         VARCHAR(100) NOT NULL,
    perfil       perfil_admin NOT NULL DEFAULT 'admin',
    ativo        BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_admin_email ON usuarios_admin (email);