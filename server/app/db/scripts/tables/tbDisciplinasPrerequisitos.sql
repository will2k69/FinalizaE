CREATE TABLE IF NOT EXISTS disciplinas_prerequisitos (
    id_disciplina INTEGER NOT NULL REFERENCES disciplinas(id_disciplina) ON DELETE CASCADE,
    id_prerequisito INTEGER NOT NULL REFERENCES disciplinas(id_disciplina) ON DELETE RESTRICT,
    PRIMARY KEY (id_disciplina, id_prerequisito),
    CONSTRAINT ck_prereq_self CHECK (id_disciplina <> id_prerequisito)
);

CREATE INDEX IF NOT EXISTS idx_prereq_disciplina ON disciplinas_prerequisitos (id_disciplina);
CREATE INDEX IF NOT EXISTS idx_prereq_prerequisito ON disciplinas_prerequisitos (id_prerequisito);
