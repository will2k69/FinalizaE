WITH dados_enfase (cod_disciplina, cod_enfase) AS (
    VALUES
        ('COMP404', 'computacao_visual'),
        ('COMP404', 'sistemas_inteligentes'),
        ('COMP404', 'sistemas_computacao'),
        ('COMP390', 'computacao_visual'),
        ('COMP390', 'sistemas_inteligentes'),
        ('COMP393', 'computacao_visual'),
        ('COMP393', 'sistemas_inteligentes'),
        ('COMP393', 'sistemas_computacao'),
        ('COMP396', 'computacao_visual'),
        ('COMP400', 'computacao_visual'),
        ('COMP397', 'sistemas_inteligentes'),
        ('COMP401', 'sistemas_inteligentes'),
        ('COMP391', 'sistemas_computacao'),
        ('COMP398', 'sistemas_computacao'),
        ('COMP402', 'sistemas_computacao'),
        ('COMP389', 'sistemas_informacao'),
        ('COMP392', 'sistemas_informacao'),
        ('COMP395', 'sistemas_informacao'),
        ('COMP399', 'sistemas_informacao'),
        ('COMP403', 'sistemas_informacao')
)
INSERT INTO disciplinas_enfases (id_disciplina, id_enfase)
SELECT d.id_disciplina, e.id_enfase
FROM dados_enfase x
JOIN disciplinas d ON d.codigo = x.cod_disciplina
JOIN enfases e ON e.codigo = x.cod_enfase
ON CONFLICT DO NOTHING;
