from __future__ import annotations

"""
CLI para extrair disciplinas de um PDF de historico academico.

Este modulo define um comando de linha de comando que:
1. Recebe o caminho de um PDF de historico.
2. Processa o arquivo com o extrator de disciplinas.
3. Salva o resultado em JSON com metadados basicos.


OBS.: Este módulo não é consumido pela API REST, mas pode ser
usado de forma independente para processar PDFs localmente.
"""

import argparse
import json
from pathlib import Path

from app.extractor import extract_disciplines_from_pdf


def main() -> None:
    """Executa o fluxo principal da CLI.

    O comando aceita:
    - `pdf`: caminho obrigatorio para o arquivo PDF do historico.
    - `--output`/`-o`: caminho opcional para o JSON de saida.

    Regras de funcionamento:
    - Encerra com erro se o PDF nao existir.
    - Encerra com erro se nenhuma disciplina for extraida.
    - Gera um nome padrao `<nome_do_pdf>_finalizae.json` quando a saida
      nao e informada.
    """
    parser = argparse.ArgumentParser(
        description="Extrai disciplinas do historico academico em PDF e exporta JSON."
    )
    parser.add_argument("pdf", help="Caminho do arquivo PDF de historico")
    parser.add_argument(
        "--output",
        "-o",
        help="Caminho do JSON de saida",
    )

    args = parser.parse_args()
    pdf_path = Path(args.pdf)

    if not pdf_path.exists() or not pdf_path.is_file():
        raise SystemExit(f"Arquivo nao encontrado: {pdf_path}")

    with pdf_path.open("rb") as pdf_file:
        disciplinas = extract_disciplines_from_pdf(pdf_file.read())

    if not disciplinas:
        raise SystemExit("Nenhuma disciplina foi extraida do PDF informado.")

    output_path = Path(args.output) if args.output else pdf_path.with_name(f"{pdf_path.stem}_finalizae.json")
    with output_path.open("w", encoding="utf-8") as json_file:
        json.dump(
            {
                "total_disciplinas": len(disciplinas),
                "disciplinas": disciplinas,
            },
            json_file,
            ensure_ascii=False,
            indent=2,
        )

    print(f"JSON exportado em: {output_path}")


if __name__ == "__main__":
    main()
