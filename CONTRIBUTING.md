# Guia de Contribuicao

Este documento define regras de trabalho para manter o projeto consistente, legivel e facil de evoluir.

## Principios

- Prefira solucoes simples e explicitas.
- Faca mudancas pequenas, focadas e verificaveis.
- Evite duplicacao quando ja existir uma abstracao adequada.
- Documente mudancas que alterem comportamento, setup ou fluxo.

## Organizacao do Projeto

### Frontend

- `view/css/global`: estilos reutilizados em mais de uma tela.
- `view/css/pages`: estilos especificos de paginas.
- `view/javascript/features`: logica compartilhada entre fluxos.
- `view/javascript/pages`: comportamento especifico de cada tela.
- `view/pages`: telas HTML do fluxo principal.

### Python

- `server/app/main.py`: bootstrap da API (FastAPI, middlewares e routers).
- `server/app/api/routes`: endpoints HTTP.
- `server/app/services`: orquestracao dos casos de uso.
- `server/app/parsers`: parsing de fontes externas (PDF).
- `server/app/model/schemas`: contratos de dados (Pydantic).
- `server/app/model/domain`: regras de negocio puras (quando houver).
- `server/app/model/entities`: entidades ORM (quando houver persistencia).
- `server/app/model/repositories`: acesso a banco (quando houver persistencia).
- `server/cli.py`: interface de linha de comando para extracao.

## Convencoes de Codigo

### HTML, CSS e JavaScript

- Use nomes descritivos para classes, funcoes e variaveis.
- Preserve a separacao entre logica de tela e logica compartilhada.
- Evite scripts com multiplas responsabilidades.
- Mantenha nomes e estrutura coerentes com o fluxo academico ja existente.

### Python

- Siga PEP 20, PEP 8, PEP 257 e PEP 484.
- Prefira funcoes curtas e com uma responsabilidade clara.
- Use docstrings em modulos e funcoes publicas.
- Use type hints em interfaces publicas e contratos relevantes.
- Evite comentarios redundantes; prefira nomes claros.

## PEPs Aplicadas na Pratica

### PEP 20

- Evite complexidade acidental.
- Prefira codigo explicito a atalhos dificeis de manter.
- Refatore apenas quando a clareza realmente melhorar.

### PEP 8

- Mantenha nomenclatura consistente.
- Organize imports por grupos.
- Preserve espacamento e quebras de linha legiveis.

### PEP 257

- Escreva docstrings curtas e informativas.
- Documente intencao, parametros e retorno quando isso ajudar a leitura.

### PEP 484

- Tipos devem comunicar contrato, nao ornamentar o codigo.
- Anote retorno e parametros de funcoes publicas.
- Use estruturas tipadas quando os dados possuirem formato conhecido.

## Commits e Pull Requests

Formato recomendado de commit:

```text
tipo: resumo curto
```

Exemplos:

- `docs: amplia README principal`
- `feat: adiciona validacao de historico`
- `refactor: tipa retorno do extrator`
- `fix: corrige normalizacao de status`

## Checklist Antes do Push/PR

1. A mudanca esta limitada ao problema proposto.
2. O codigo segue a organizacao de pastas do projeto.
3. O modulo Python foi validado a partir da pasta `server` com `ruff check .` e `mypy app cli.py` quando aplicavel.
4. A documentacao foi atualizada se o comportamento mudou.
5. Nao foram incluidas mudancas nao relacionadas.

## Revisao

A revisao deve focar em:

- regressao de comportamento
- clareza da solucao
- aderencia a organizacao do projeto
- impacto em manutencao futura

Questoes de estilo ja cobertas por ferramenta devem ser resolvidas antes do PR.
