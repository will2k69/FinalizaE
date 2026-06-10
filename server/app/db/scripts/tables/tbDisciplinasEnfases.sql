CREATE TABLE IF NOT EXISTS disciplinas_enfases (
    id_disciplina INTEGER NOT NULL REFERENCES disciplinas(id_disciplina) ON DELETE CASCADE,
    id_enfase INTEGER NOT NULL REFERENCES enfases(id_enfase) ON DELETE CASCADE,
    PRIMARY KEY (id_disciplina, id_enfase)
);

CREATE INDEX IF NOT EXISTS idx_disciplina_enfase_disciplina ON disciplinas_enfases (id_disciplina);
CREATE INDEX IF NOT EXISTS idx_disciplina_enfase_enfase ON disciplinas_enfases (id_enfase);
