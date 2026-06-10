INSERT INTO enfases (codigo, nome)
VALUES
    ('computacao_visual', 'Computacao Visual'),
    ('sistemas_inteligentes', 'Sistemas Inteligentes'),
    ('sistemas_computacao', 'Sistemas de Computacao'),
    ('sistemas_informacao', 'Sistemas de Informacao')
ON CONFLICT (codigo) DO UPDATE
SET nome = EXCLUDED.nome;
