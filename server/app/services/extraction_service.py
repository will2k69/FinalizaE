from __future__ import annotations

import re

from app.model.schemas.discipline import DisciplineRecord
from app.parsers.pdf_parser import extract_table_rows, parse_discipline_rows

"""Orquestra a extracao de disciplinas a partir de bytes de um PDF."""

_STATUS_KEYWORDS: tuple[str, ...] = (
    "CUMPRIU",
    "MATRICULADO",
    "APR",
    "REP",
    "TRANCADO",
    "REPF",
)

_CODE_PATTERN: re.Pattern[str] = re.compile(r"\b([A-Z]{2,}\d{2,})\b")

_REQUIRED_COLUMNS: frozenset[str] = frozenset(
    {"ano", "componente", "hora_aula", "ch", "media", "situacao"}
)


def extract_disciplines_from_pdf(pdf_bytes: bytes) -> list[DisciplineRecord]:
    """Extrai e valida disciplinas de um PDF de historico academico."""
    rows = extract_table_rows(pdf_bytes)
    if not rows:
        return []

    raw = parse_discipline_rows(
        rows,
        status_keywords=_STATUS_KEYWORDS,
        code_pattern=_CODE_PATTERN,
        required_columns=_REQUIRED_COLUMNS,
    )

    return [DisciplineRecord(**record) for record in raw]
