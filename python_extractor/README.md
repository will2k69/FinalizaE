# Extrator de Historico Academico (Python)

Servico em Python para extrair as disciplinas do historico academico em PDF e gerar JSON com os campos:

- ano_periodo_letivo
- codigo_disciplina
- nome_disciplina
- hora_aula
- ch
- media
- situacao

## 1) Instalar dependencias

```bash
cd python_extractor
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
```

## 2) Rodar a API

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
OBS.: certifique-se de estar em "...FinalizaE/python_extractor"

A rota de extracao usada pela tela de upload:

- `POST /api/extrair-historico`

Envie o arquivo no campo `file` (multipart/form-data).

## 3) Extrair via linha de comando (opcional)

```bash
python cli.py "C:/caminho_do_historico.pdf"
```

Para definir o arquivo de saida:

```bash
python cli.py "C:/caminho/historico.pdf" --output "C:/caminho/saida.json"
```
