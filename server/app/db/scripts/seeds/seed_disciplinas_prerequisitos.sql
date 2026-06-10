WITH dados_prereq (cod_disciplina, cod_pre) AS (
    VALUES
        ('COMP368', 'COMP359'),
        ('COMP369', 'COMP362'),
        ('COMP369', 'COMP364'),
        ('COMP370', 'COMP363'),
        ('COMP371', 'COMP367'),
        ('COMP372', 'COMP364'),
        ('COMP372', 'COMP365'),
        ('COMP372', 'COMP368'),
        ('COMP373', 'COMP364'),
        ('COMP373', 'COMP365'),
        ('COMP373', 'COMP368'),
        ('COMP374', 'COMP364'),
        ('COMP374', 'COMP369'),
        ('COMP378', 'COMP366'),
        ('COMP379', 'COMP364'),
        ('COMP379', 'COMP376'),
        ('COMP380', 'COMP360'),
        ('COMP380', 'COMP364'),
        ('COMP383', 'COMP377'),
        ('COMP384', 'COMP377'),
        ('COMP384', 'COMP383'),
        ('COMP385', 'COMP377'),
        ('COMP385', 'COMP383'),
        ('COMP385', 'COMP384')
)
INSERT INTO disciplinas_prerequisitos (id_disciplina, id_prerequisito)
SELECT d.id_disciplina, p.id_disciplina
FROM dados_prereq x
JOIN disciplinas d ON d.codigo = x.cod_disciplina
JOIN disciplinas p ON p.codigo = x.cod_pre
ON CONFLICT DO NOTHING;
