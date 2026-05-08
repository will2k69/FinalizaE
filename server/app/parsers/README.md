# Camada Parsers

A pasta parsers/ concentra a extracao e interpretacao de dados vindos de fontes externas.

---

## Responsabilidade principal

A camada de parsers deve:

- abrir e ler arquivos de entrada (PDF, CSV, JSON, etc.)
- normalizar texto e estrutura de linhas/colunas
- identificar padroes de cabecalho e campos relevantes
- devolver dados estruturados em formato neutro para services

Ela nao deve:

- expor HTTP
- montar resposta final da API
- decidir regras de negocio (ex.: prioridade de recomendacao)
- acessar banco de dados

---

## Modulos

### pdf_parser.py

Parser de historico academico em PDF.

Responsabilidades atuais:

- extrair linhas de tabelas com pdfplumber
- detectar cabecalho da tabela de disciplinas
- mapear indices de colunas relevantes
- validar se uma linha aparenta ser disciplina valida
- extrair codigo/nome/situacao e demais campos
- retornar lista de dicionarios para o extraction_service

---

## Relacao com as demais camadas

```text
services/extraction_service.py  ->  parsers/pdf_parser.py
                                ->  model/schemas/discipline.py
```

- O service chama o parser para leitura e interpretacao
- O parser retorna dados estruturados
- O service transforma em schemas Pydantic

---

## Convencoes de implementacao

Para manter consistencia em parsers/:

- manter funcoes pequenas e focadas em parsing
- separar normalizacao, deteccao e extracao em funcoes distintas
- nao acoplar parser a FastAPI ou HTTPException
- preferir tipos simples de retorno (dict/list/tuplas) para facilitar testes
