# Extrator de Historico Academico

Servico em Python para extrair disciplinas de um historico academico em PDF e gerar JSON estruturado para a aplicacao FinalizaE.

## Campos extraidos

- ano_periodo_letivo
- codigo_disciplina
- nome_disciplina
- hora_aula
- ch
- media
- situacao

## Setup

```bash
cd python_extractor
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Executar a API

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
OBS.: certifique-se de estar em "...FinalizaE/python_extractor"

A rota de extracao usada pela tela de upload:

- `POST /api/extrair-historico`

Health check:

- `GET /health`

Envie o PDF no campo `file` usando `multipart/form-data`.

## Executar via CLI

```bash
python cli.py "C:/caminho_do_historico.pdf"
```

Para definir um arquivo de saida:

```bash
python cli.py "C:/caminho/historico.pdf" --output "C:/caminho/saida.json"
```

## Padronizacao e Qualidade

O modulo segue explicitamente:

- PEP 20 para decisoes de simplicidade e clareza
- PEP 8 para estilo e organizacao do codigo
- PEP 257 para docstrings
- PEP 484 para type hints e contratos explicitos

Ferramentas configuradas:

```bash
pip install -r requirements-dev.txt
ruff check .
mypy app cli.py
```
