CREATE TABLE IF NOT EXISTS disciplinas_corequisitos (
    id_disciplina INTEGER NOT NULL REFERENCES disciplinas(id_disciplina) ON DELETE CASCADE,
    id_corequisito INTEGER NOT NULL REFERENCES disciplinas(id_disciplina) ON DELETE RESTRICT,
    PRIMARY KEY (id_disciplina, id_corequisito),
    CONSTRAINT ck_coreq_self CHECK (id_disciplina <> id_corequisito)
);

CREATE INDEX IF NOT EXISTS idx_coreq_disciplina ON disciplinas_corequisitos (id_disciplina);
CREATE INDEX IF NOT EXISTS idx_coreq_corequisito ON disciplinas_corequisitos (id_corequisito);
