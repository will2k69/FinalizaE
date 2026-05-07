from __future__ import annotations

import io
import re
import unicodedata

import pdfplumber

"""Leitura e parsing de tabelas de historicos academicos em PDF."""

HeaderIndices = dict[str, int]
TableRow = list[str]


def _normalize_cell(value: str | None) -> str:
    """Normaliza o conteudo de uma celula de tabela."""
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def _ascii_fold(value: str) -> str:
    """Remove acentos e converte texto para minusculas ASCII-friendly."""
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch)).lower()


def _normalize_status(value: str) -> str:
    """Normaliza status para comparacao robusta contra variacoes de OCR."""
    return re.sub(r"[^a-z]", "", _ascii_fold(value))


def _is_header_row(row: TableRow) -> bool:
    """Verifica se a linha parece ser o cabecalho da tabela de disciplinas."""
    joined = _ascii_fold(" ".join(row))
    return (
        "ano/periodo" in joined
        and "componente curricular" in joined
        and "hora aula" in joined
        and "situa" in joined
    )


def _find_header_indices(header_row: TableRow) -> HeaderIndices:
    """Mapeia os indices das colunas relevantes a partir do cabecalho."""
    indices: HeaderIndices = {}

    for idx, cell in enumerate(header_row):
        token = _ascii_fold(cell)
        if "ano/periodo" in token:
            indices["ano"] = idx
        elif token in {"codigo", "cod", "#"}:
            indices["codigo"] = idx
        elif "componente curricular" in token:
            indices["componente"] = idx
        elif "hora aula" in token:
            indices["hora_aula"] = idx
        elif token == "ch":
            indices["ch"] = idx
        elif "turma" in token:
            indices["turma"] = idx
        elif "freq" in token:
            indices["freq"] = idx
        elif "media" in token:
            indices["media"] = idx
        elif "situa" in token:
            indices["situacao"] = idx

    return indices


def _get_cell(row: TableRow, idx: int, fallback: str = "") -> str:
    """Retorna a celula no indice informado com fallback seguro."""
    if idx < 0 or idx >= len(row):
        return fallback
    return row[idx]


def _extract_code_and_name(
    component_text: str,
    fallback_code: str = "",
    code_pattern: re.Pattern[str] = re.compile(r"\b([A-Z]{2,}\d{2,})\b"),
) -> tuple[str, str]:
    """Extrai codigo e nome da disciplina a partir do texto do componente."""
    lines = [line.strip() for line in component_text.splitlines() if line.strip()]
    main_line = lines[0] if lines else component_text.strip()

    code = ""
    if fallback_code and re.fullmatch(r"[A-Z]{2,}\d{2,}", fallback_code):
        code = fallback_code

    if not code:
        match = code_pattern.search(main_line)
        if match:
            code = match.group(1)

    if code:
        name = re.sub(rf"\b{re.escape(code)}\b", "", main_line, count=1).strip(" -")
    else:
        name = main_line

    return code, re.sub(r"\s+", " ", name).strip()


def _extract_code_and_name_from_row(
    row: TableRow,
    indices: HeaderIndices,
    code_pattern: re.Pattern[str] = re.compile(r"\b([A-Z]{2,}\d{2,})\b"),
) -> tuple[str, str]:
    """Extrai codigo e nome da disciplina a partir de uma linha completa."""
    ignored_indices = {
        indices.get("ano", -1),
        indices.get("hora_aula", -1),
        indices.get("ch", -1),
        indices.get("media", -1),
        indices.get("situacao", -1),
        indices.get("turma", -1),
        indices.get("freq", -1),
    }

    candidate_cells = [
        _get_cell(row, idx)
        for idx in range(len(row))
        if idx not in ignored_indices and _get_cell(row, idx)
    ]

    code = ""
    for cell in candidate_cells:
        match = code_pattern.search(cell)
        if match:
            code = match.group(1)
            break

    component_text = _get_cell(row, indices.get("componente", -1), "")
    fallback_code = _get_cell(row, indices.get("codigo", -1), "")
    if not re.fullmatch(r"[A-Z]{2,}\d{2,}", fallback_code):
        fallback_code = code

    clean_parts: list[str] = []
    for cell in candidate_cells:
        cleaned = re.sub(r"\s+", " ", cell).strip()
        if cleaned in {"#", "*", "-"}:
            continue
        if cleaned == code:
            continue
        if re.fullmatch(r"[A-Z]{2,}\d{2,}", cleaned):
            continue
        clean_parts.append(cleaned)

    if not component_text or component_text in {"#", "*", "-"}:
        component_text = " ".join(clean_parts).strip()

    extracted_code, extracted_name = _extract_code_and_name(
        component_text,
        fallback_code,
        code_pattern,
    )

    if not extracted_name:
        extracted_name = " ".join(clean_parts).strip()

    return extracted_code, extracted_name


def _looks_like_discipline_row(
    row: TableRow,
    indices: HeaderIndices,
    status_keywords: tuple[str, ...],
) -> bool:
    """Determina se a linha representa uma disciplina valida do historico."""
    ano = _get_cell(row, indices.get("ano", -1))
    situacao = _normalize_status(_get_cell(row, indices.get("situacao", -1)))

    has_period = bool(re.search(r"\d{4}\.\d", ano))
    has_known_status = any(
        _normalize_status(keyword) in situacao for keyword in status_keywords
    )
    return has_period and has_known_status


def extract_table_rows(pdf_bytes: bytes) -> list[TableRow]:
    """Extrai e normaliza todas as linhas de tabelas encontradas no PDF."""
    all_rows: list[TableRow] = []
    settings = {
        "vertical_strategy": "lines",
        "horizontal_strategy": "lines",
        "intersection_tolerance": 5,
        "snap_tolerance": 3,
    }

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables(table_settings=settings)
            for table in tables:
                for raw_row in table:
                    row = [_normalize_cell(col) for col in raw_row]
                    if any(row):
                        all_rows.append(row)

    return all_rows


def parse_discipline_rows(
    rows: list[TableRow],
    status_keywords: tuple[str, ...],
    code_pattern: re.Pattern[str],
    required_columns: frozenset[str],
) -> list[dict[str, str]]:
    """Interpreta as linhas extraidas e retorna disciplinas como dicionarios."""
    header_indices: HeaderIndices = {}
    result: list[dict[str, str]] = []

    for row in rows:
        if _is_header_row(row):
            header_indices = _find_header_indices(row)
            continue

        if not header_indices or not required_columns.issubset(header_indices):
            continue

        if not _looks_like_discipline_row(row, header_indices, status_keywords):
            continue

        codigo, nome = _extract_code_and_name_from_row(
            row, header_indices,
            code_pattern
        )
        result.append(
            {
                "ano_periodo_letivo": _get_cell(row, header_indices["ano"]),
                "codigo_disciplina": codigo,
                "nome_disciplina": nome,
                "hora_aula": _get_cell(row, header_indices["hora_aula"]),
                "ch": _get_cell(row, header_indices["ch"]),
                "media": _get_cell(row, header_indices["media"]),
                "situacao": _get_cell(row, header_indices["situacao"])
                .strip()
                .replace(" ", ""),
            }
        )

    return result
