WITH dados_admins (email, senha_hash, nome, perfil) AS (
    VALUES
        ('will@finalizae.com', '1234', 'Will', 'admin'::perfil_admin),
        ('luana@finalizae.com', '1234', 'Luana', 'admin'::perfil_admin),
        ('edgar@finalizae.com', '1234', 'Edgar', 'admin'::perfil_admin)
)
INSERT INTO usuarios_admin (email, senha_hash, nome, perfil)
SELECT email, senha_hash, nome, perfil
FROM dados_admins
ON CONFLICT (email) DO UPDATE
SET
    nome   = EXCLUDED.nome,
    perfil = EXCLUDED.perfil,
    ativo  = TRUE;