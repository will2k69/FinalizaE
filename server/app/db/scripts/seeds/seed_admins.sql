WITH dados_admins (email, senha_hash, nome, perfil) AS (
    VALUES
    ('will@finalizae.com', '$2b$12$3iVuL8dCoEb80LAak301weBE0EnlNhxkUjC9fEiCWygxM..umnuW2', 'Will', 'admin'::perfil_admin),
    ('luana@finalizae.com', '$2b$12$xZATPoxaDec1qFbTRRfsxePREo.XDLiO4qo.916/Pr.zYZZUczLjy', 'Luana', 'admin'::perfil_admin),
    ('edgar@finalizae.com', '$2b$12$bhpWJ6CxXrDaslspzOJEO.9hqIBirYr9QLwQhi.fUPZMJRJjrEvTG', 'Edgar', 'admin'::perfil_admin)
)
INSERT INTO usuarios_admin (email, senha_hash, nome, perfil)
SELECT email, senha_hash, nome, perfil
FROM dados_admins
ON CONFLICT (email) DO UPDATE
SET
    nome   = EXCLUDED.nome,
    perfil = EXCLUDED.perfil,
    ativo  = TRUE;