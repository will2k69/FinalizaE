CREATE TABLE tbAdmin (
    id_admin SERIAL PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL
);

INSERT INTO tbAdmin (usuario, senha_hash)
VALUES
('Luana', '1234'),
('Will', '1234'),
('Jota', '1234'),
('Edgar', '1234');