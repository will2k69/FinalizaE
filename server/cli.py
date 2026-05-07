from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from app.model.schemas.discipline import DisciplineRecord
from app.services.extraction_service import extract_disciplines_from_pdf

"""Interface de linha de comando para extracao de historicos academicos."""


def build_output_payload(disciplinas: list[DisciplineRecord]) -> dict[str, Any]:
    """Monta a estrutura JSON exportada pela CLI."""
    return {
        "total_disciplinas": len(disciplinas),
        "disciplinas": disciplinas,
    }


def main() -> None:
    """Executa a extracao do PDF informado e salva o resultado em JSON."""
    parser = argparse.ArgumentParser(
        description="Extrai disciplinas do historico academico em PDF e exporta JSON."
    )
    parser.add_argument("pdf", help="Caminho do arquivo PDF de historico")
    parser.add_argument("--output", "-o", help="Caminho do JSON de saida")

    args = parser.parse_args()
    pdf_path = Path(args.pdf)

    if not pdf_path.is_file():
        raise SystemExit(f"Arquivo nao encontrado: {pdf_path}")

    with pdf_path.open("rb") as pdf_file:
        disciplinas = extract_disciplines_from_pdf(pdf_file.read())

    if not disciplinas:
        raise SystemExit("Nenhuma disciplina foi extraida do PDF informado.")

    output_path = (
        Path(args.output)
        if args.output
        else pdf_path.with_name(f"{pdf_path.stem}_finalizae.json")
    )
    with output_path.open("w", encoding="utf-8") as json_file:
        json.dump(
            build_output_payload(disciplinas),
            json_file,
            ensure_ascii=False,
            indent=2,
        )

    print(f"JSON exportado em: {output_path}")


if __name__ == "__main__":
    main()
