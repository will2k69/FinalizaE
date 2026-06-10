WITH dados_coreq (cod_disciplina, cod_coreq) AS (
    VALUES
        ('COMP372', 'COMP373'),
        ('COMP373', 'COMP372')
)
INSERT INTO disciplinas_corequisitos (id_disciplina, id_corequisito)
SELECT d.id_disciplina, c.id_disciplina
FROM dados_coreq x
JOIN disciplinas d ON d.codigo = x.cod_disciplina
JOIN disciplinas c ON c.codigo = x.cod_coreq
ON CONFLICT DO NOTHING;
