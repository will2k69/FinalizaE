# FinalizaE

Sistema para analise de progresso academico e recomendacao de disciplinas com base no PPC de um curso. O projeto combina um frontend estatico em HTML, CSS e JavaScript com um servico Python responsavel por extrair disciplinas de historicos academicos em PDF.

## Objetivo

Eliminar o planejamento manual de matricula, reduzir erros de pre-requisito e apoiar decisoes de progressao academica com base em dados extraidos do historico do aluno.

## Visao Geral

O fluxo principal do sistema conduz o aluno pelas telas de inicio, envio do historico, revisao e resultado.

## Arquitetura

### Frontend

- Landing page em `index.html`.
- Fluxo principal a partir de `pages/tela_inicial.html`.
- Estilos globais em `css/global`.
- Estilos especificos de pagina em `css/pages`.
- Scripts compartilhados em `javascript/features`.
- Scripts especificos de tela em `javascript/pages`.

### Extrator Python

- API FastAPI em `python_extractor/app/main.py`.
- Logica de extracao em `python_extractor/app/extractor.py`.
- Execucao por linha de comando em `python_extractor/cli.py`.

## Como Executar

### Frontend

Como o frontend e estatico, existem duas formas simples de rodar:

1. Abrir `index.html` diretamente no navegador para visualizar a landing page.
2. Servir a pasta do projeto localmente com uma extensao de servidor estatico ou um servidor HTTP simples, para evitar problemas com caminhos relativos e integracao com a API.

### Extrator Python

```bash
cd python_extractor
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Rota principal:

- `POST /api/extrair-historico`

Health check:

- `GET /health`

## Qualidade de Codigo e PEPs Adotadas

O modulo Python do projeto passa a seguir explicitamente estas PEPs:

- PEP 20: guia de decisao para manter o codigo simples, explicito e legivel.
- PEP 8: estilo, nomenclatura, organizacao e consistencia visual do codigo.
- PEP 257: padronizacao de docstrings em modulos e funcoes publicas.
- PEP 484: uso de type hints para explicitar contratos de entrada e saida.

Na pratica, isso significa:

- funcoes com nomes claros e responsabilidade limitada
- docstrings concisas e consistentes
- contratos de retorno explicitos
- validacao automatizada de estilo e tipagem

## Ferramentas de Validacao

No modulo Python foram configuradas ferramentas para checagem local:

- `ruff` para lint e regras de estilo alinhadas a PEP 8
- `mypy` para checagem estatica de tipos alinhada a PEP 484

Instalacao:

```bash
cd python_extractor
pip install -r requirements-dev.txt
```

Execucao:

```bash
ruff check .
mypy app cli.py
```

## Boas Praticas do Repositorio

- Reutilize logica compartilhada em `javascript/features` antes de duplicar codigo em telas.
- Mantenha scripts especificos de fluxo em `javascript/pages`.
- Prefira mudancas pequenas e localizadas.
- Atualize documentacao quando uma alteracao mudar fluxo, setup ou comportamento esperado.
- No Python, priorize clareza sobre abstracoes desnecessarias.

As regras detalhadas de contribuicao estao em `CONTRIBUTING.md`.

## Fluxo de Uso

1. O usuario acessa `index.html`.
2. O fluxo principal segue para `pages/tela_inicial.html`.
3. O historico academico e enviado para o extrator.
4. O extrator devolve as disciplinas identificadas em JSON.
5. A interface permite revisao e geracao do resultado final do planejamento.

## Troubleshooting

- Se a API nao iniciar, verifique se o ambiente virtual do diretorio `python_extractor` esta ativado.
- Se a extracao falhar, valide se o PDF foi retirado diretamente do portal acadêmico (SIGAA).
- Se o editor acusar imports Python nao resolvidos, aponte o interpretador para `python_extractor/.venv`.

## Contribuicao

Antes de abrir PR:

1. Rode as validacoes do modulo Python quando houver alteracao em `python_extractor`.
2. Revise se a mudanca respeita a organizacao atual de pastas.
3. Atualize README ou guia de contribuicao se o fluxo do projeto mudar.

Mais detalhes em `CONTRIBUTING.md`.
