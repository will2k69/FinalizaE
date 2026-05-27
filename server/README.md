# FinalizaE - Servidor

Backend do FinalizaE.

## Resumo

Para rodar o projeto localmente, siga esta ordem:

1. Criar o banco `finalizae` no PostgreSQL.
2. Rodar os scripts em [app/db/scripts](app/db/scripts).
3. Instalar as dependencias do backend.
4. Subir a API com `uvicorn`.
5. Abrir o frontend com Live Server no VS Code.

## 1. Banco de dados

Antes de subir a API, o banco precisa existir e estar populado.

Rode os scripts nesta ordem:

1. [tbDisciplinas.sql](app/db/scripts/tbDisciplinas.sql) - cria o tipo `tipo_disciplina`, a tabela `disciplinas` e os indices.
2. [seed_disciplinas.sql](app/db/scripts/seed_disciplinas.sql) - insere as disciplinas iniciais.

Se o banco estiver vazio, a API vai subir, mas as telas de disciplinas não vão mostrar dados.

## 2. Instalar dependencias

No terminal, entre na pasta `server` e instale os pacotes:

```bash
cd server
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## 3. Rodar a API local

Use estes dados locais do banco:

```bash
DB_HOST=localhost DB_PORT=5432 DB_NAME=NOME_BANCO DB_USER=postgres DB_PASSWORD=SENHA_BANCO uvicorn app.main:app
```

Se estiver no PowerShell do Windows, use esta forma:

```powershell
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:DB_NAME="NOME_BD"
$env:DB_USER="postgres"
$env:DB_PASSWORD="SENHA_BD"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Depois teste se a API subiu:

```bash
http://127.0.0.1:8000/health
```

## 4. Rodar o frontend

Abra [view/index.html](../view/index.html) no VS Code e execute com Live Server.

Isso é importante porque o frontend foi pensado para rodar em servidor (local ou não). Abrir o HTML direto no navegador pode quebrar os caminhos e a chamada da API.

## 5. Como testar tudo

Depois de subir o banco, a API e o frontend, confira:

1. A home abre no Live Server.
2. A tela de disciplinas carrega os dados.
3. O cadastro de disciplina funciona.
4. A edição de disciplina funciona.
5. A exclusão de disciplina funciona.

Se aparecer `Failed to fetch`, normalmente o problema está em um destes pontos:

1. A API não está rodando.
2. O Live Server está em uma porta diferente da esperada.
3. O CORS do backend não está aceitando a origem do frontend.
4. O banco não foi criado ou não foi populado.

## 6. Endpoint principal

- `GET /health` - verifica se a API está no ar.
- `POST /api/extrair-historico` - recebe o PDF do histórico no campo `file`.
- `GET /api/disciplinas` - lista as disciplinas cadastradas.
- `POST /api/disciplinas` - cria disciplina.
- `PUT /api/disciplinas/{id}` - atualiza disciplina.
- `DELETE /api/disciplinas/{id}` - remove disciplina.

## 7. CLI de extração

Se quiser rodar a extração sem abrir a API, use:

```bash
python cli.py "C:/caminho_do_historico.pdf"
```

Para salvar em outro arquivo:

```bash
python cli.py "C:/caminho_do_historico.pdf" --output "C:/caminho/saida.json"
```

## 8. Campos extraídos do histórico

| Campo | Descricao |
|---|---|
| `ano_periodo_letivo` | Ex: `2023.1` |
| `codigo_disciplina` | Ex: `COMP364` |
| `nome_disciplina` | Ex: `Estrutura de Dados` |
| `hora_aula` | Carga horaria em aulas |
| `ch` | Carga horaria em horas |
| `media` | Nota final |
| `situacao` | Ex: `APR`, `REP`, `CUMPRIU`, `MATRICULADO` |

## 9. Checagem rapida

Se algo falhar, confira esta lista:

1. PostgreSQL está ligado.
2. O banco `finalizae` existe.
3. Os scripts do banco foram executados.
4. O ambiente virtual foi ativado.
5. A API está rodando na porta 8000.
6. O frontend está aberto no Live Server.

## 10. Qualidade

Para validar o backend:

```bash
pip install -r requirements-dev.txt
ruff check .
mypy app cli.py
```
