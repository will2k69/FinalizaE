from __future__ import annotations

"""Extracao de disciplinas de historico academico em PDF.

Este modulo le tabelas do PDF com `pdfplumber`, identifica cabecalhos,
normaliza campos e retorna uma lista de disciplinas em formato estruturado.
"""

import io
import re
import unicodedata
from typing import Dict, List, Optional

import pdfplumber


STATUS_KEYWORDS = (
    "CUMPRIU",
    "MATRICULADO",
    "APR",
    "REP",
    "TRANCADO",
    "REPF",
)

CODE_PATTERN = re.compile(r"\b([A-Z]{3,}\d{2,})\b")


def _normalize_cell(value: Optional[str]) -> str:
    """Normaliza o conteudo de uma celula de tabela.

    Remove quebras/duplicidade de espacos e converte `None` para string vazia.
    """
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def _ascii_fold(value: str) -> str:
    """Remove acentos e converte texto para minusculas ASCII-friendly."""
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch)).lower()


def _normalize_status(value: str) -> str:
    """Normaliza status para comparacao robusta contra variacoes de OCR/PDF."""
    # Trata fragmentacao comum do OCR/PDF, como "MATRICUL ADO".
    return re.sub(r"[^a-z]", "", _ascii_fold(value))


def _is_header_row(row: List[str]) -> bool:
    """Verifica se uma linha parece ser o cabecalho da tabela de disciplinas."""
    joined = _ascii_fold(" ".join(row))
    return (
        "ano/periodo" in joined
        and "componente curricular" in joined
        and "hora aula" in joined
        and "situa" in joined
    )


def _find_header_indices(header_row: List[str]) -> Dict[str, int]:
    """Mapeia os indices das colunas relevantes a partir da linha de cabecalho."""
    indices: Dict[str, int] = {}

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


def _extract_code_and_name(component_text: str, fallback_code: str = "") -> tuple[str, str]:
    """Extrai codigo e nome da disciplina a partir do texto do componente.

    Usa `fallback_code` quando valido e, se necessario, tenta encontrar o
    codigo no texto via regex.
    """
    lines = [line.strip() for line in component_text.splitlines() if line.strip()]
    main_line = lines[0] if lines else component_text.strip()

    code = ""
    if fallback_code and re.fullmatch(r"[A-Z]{3,}\d{2,}", fallback_code):
        code = fallback_code

    if not code:
        match = CODE_PATTERN.search(main_line)
        if match:
            code = match.group(1)

    if code:
        name = re.sub(rf"\b{re.escape(code)}\b", "", main_line, count=1).strip(" -")
    else:
        name = main_line

    return code, re.sub(r"\s+", " ", name).strip()


def _get_cell(row: List[str], idx: int, fallback: str = "") -> str:
    """Retorna a celula no indice informado com fallback seguro para limites."""
    if idx < 0 or idx >= len(row):
        return fallback
    return row[idx]


def _extract_code_and_name_from_row(row: List[str], indices: Dict[str, int]) -> tuple[str, str]:
    """Extrai codigo e nome da disciplina a partir de uma linha completa.

    Ignora colunas numericas/administrativas, tenta localizar codigo em campos
    candidatos e monta um nome limpo quando o campo de componente vier incompleto.
    """
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
        match = CODE_PATTERN.search(cell)
        if match:
            code = match.group(1)
            break

    component_text = _get_cell(row, indices.get("componente", -1), "")
    fallback_code = _get_cell(row, indices.get("codigo", -1), "")
    if not re.fullmatch(r"[A-Z]{3,}\d{2,}", fallback_code):
        fallback_code = code

    clean_parts: List[str] = []
    for cell in candidate_cells:
        cleaned = re.sub(r"\s+", " ", cell).strip()
        if cleaned in {"#", "*", "-"}:
            continue
        if cleaned == code:
            continue
        if re.fullmatch(r"[A-Z]{3,}\d{2,}", cleaned):
            continue
        clean_parts.append(cleaned)

    if not component_text or component_text in {"#", "*", "-"}:
        component_text = " ".join(clean_parts).strip()

    extracted_code, extracted_name = _extract_code_and_name(component_text, fallback_code)

    if not extracted_name:
        extracted_name = " ".join(clean_parts).strip()

    return extracted_code, extracted_name


def _looks_like_discipline_row(row: List[str], indices: Dict[str, int]) -> bool:
    """Determina se a linha representa uma disciplina valida do historico.

    A linha e considerada valida quando possui periodo no formato esperado
    e status reconhecido (aprovado, reprovado, matriculado etc.).
    """
    ano_idx = indices.get("ano", -1)
    situacao_idx = indices.get("situacao", -1)

    ano = _get_cell(row, ano_idx)
    situacao = _normalize_status(_get_cell(row, situacao_idx))

    has_period = bool(re.search(r"\d{4}\.\d", ano))
    has_known_status = any(_normalize_status(keyword) in situacao for keyword in STATUS_KEYWORDS)

    return has_period and has_known_status


def _extract_table_rows(pdf_bytes: bytes) -> List[List[str]]:
    """Extrai e normaliza todas as linhas de tabelas de um PDF.

    Usa estrategias de deteccao de linhas no `pdfplumber` para melhorar a
    recuperacao de tabelas em historicos academicos.
    """
    all_rows: List[List[str]] = []

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


def extract_disciplines_from_pdf(pdf_bytes: bytes) -> List[Dict[str, str]]:
    """Extrai disciplinas de um PDF de historico academico.

    Args:
        pdf_bytes: Conteudo binario do arquivo PDF.

    Returns:
        Lista de dicionarios com os campos:
        `ano_periodo_letivo`, `codigo_disciplina`, `nome_disciplina`,
        `hora_aula`, `ch`, `media` e `situacao`.
    """
    rows = _extract_table_rows(pdf_bytes)
    if not rows:
        return []

    header_indices: Dict[str, int] = {}
    extracted: List[Dict[str, str]] = []

    for row in rows:
        if _is_header_row(row):
            header_indices = _find_header_indices(row)
            continue

        if not header_indices:
            continue

        required = {"ano", "componente", "hora_aula", "ch", "media", "situacao"}
        if not required.issubset(header_indices.keys()):
            continue

        if not _looks_like_discipline_row(row, header_indices):
            continue

        ano = _get_cell(row, header_indices["ano"])
        hora_aula = _get_cell(row, header_indices["hora_aula"])
        ch = _get_cell(row, header_indices["ch"])
        media = _get_cell(row, header_indices["media"])
        situacao = _get_cell(row, header_indices["situacao"]).strip().replace(" ", "")

        codigo, nome = _extract_code_and_name_from_row(row, header_indices)

        extracted.append(
            {
                "ano_periodo_letivo": ano,
                "codigo_disciplina": codigo,
                "nome_disciplina": nome,
                "hora_aula": hora_aula,
                "ch": ch,
                "media": media,
                "situacao": situacao,
            }
        )

    return extracted
