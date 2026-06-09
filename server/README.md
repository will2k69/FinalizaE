# FinalizaE — Servidor

Backend do FinalizaE em Python + FastAPI. Responsavel por extrair disciplinas de historicos academicos em PDF, processar regras de progressao e gerar recomendacoes de matricula.


## Setup

```bash
cd server
python -m venv .venv
.venv\Scripts\activate       # Windows
# source .venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
```

## Executar as APIs

Extrator
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Batabase
```bash
DB_HOST=localhost DB_PORT=5432 DB_NAME=finalizae DB_USER=postgres DB_PASSWORD=SUA_PW uvicorn app.main:app --reload
```

Endpoints disponiveis:

- `POST /api/extrair-historico` — envia o PDF no campo `file` via `multipart/form-data`
- `GET /health` — verifica se a API esta no ar

## Executar via CLI

```bash
python cli.py "C:/caminho_do_historico.pdf"
```

Para definir o arquivo de saida:

```bash
python cli.py "C:/caminho/historico.pdf" --output "C:/caminho/saida.json"
```

## Executar via POST

> Exemplo com curl

```bash
curl -X POST "http://127.0.0.1:8000/api/extrair-historico" \
  -H "accept: application/json" \
  -F "file=@C:/caminho/historico.pdf;type=application/pdf"
```

## Campos extraidos do historico

| Campo | Descricao |
|---|---|
| `ano_periodo_letivo` | Ex: `2023.1` |
| `codigo_disciplina` | Ex: `COMP364` |
| `nome_disciplina` | Ex: `Estrutura de Dados` |
| `hora_aula` | Carga horaria em aulas |
| `ch` | Carga horaria em horas |
| `media` | Nota final |
| `situacao` | Ex: `APR`, `REP`, `CUMPRIU`, `MATRICULADO` |

## Padronizacao e Qualidade

```bash
pip install -r requirements-dev.txt
ruff check .
mypy app cli.py
```
