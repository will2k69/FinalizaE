# Camada Model

Contém tudo relacionado a **dados e regras de negócio** do FinalizaE. Nenhum módulo desta camada deve conhecer FastAPI, HTTP, detalhes de infraestrutura etc, pois isso garante que a lógica possa ser testada e evoluída de forma isolada.

---

## `schemas/`

**Contratos de dados** usados nas bordas da aplicação (entrada e saída da API).

Definidos com Pydantic `BaseModel`, o que garante validação automática e serialização JSON pelo FastAPI.

---

## `domain/`

**Regras de negócio puras** do FinalizaE — sem dependência de banco, HTTP ou framework.

Cada módulo resolve uma pergunta específica do domínio:

| Arquivo | Responsabilidade |
| `prerequisite_checker.py` *(exemplo)* | Verifica se os pré-requisitos de uma disciplina foram cumpridos

Exemplo de uso esperado:

```python
from app.model.domain.prerequisite_checker import pode_cursar

pode_cursar(disciplina=comp364, concluidas={"COMP359"})  # True ou False
```

---

## `entities/`

**Entidades do banco de dados** mapeadas via ORM (SQLAlchemy ou similar).

Cada classe representa uma tabela (esta camada só será relevante quando persistência for introduzida).

| Arquivo | Tabela |
|---|---|
| `aluno.py` *(futuro)* | `aluno` |
| `discipline.py` *(futuro)* | `disciplina_historico` |

> Nota: as entidades ORM são distintas dos schemas Pydantic. O schema define o contrato da API; a entidade define a estrutura no banco.

---

## `repositories/`

**Acesso ao banco de dados** — isola as queries do restante da aplicação.

Os serviços em `app/services/` chamam os repositórios; os repositórios usam as entidades de `entities/`.

| Arquivo | Responsabilidade |
|---|---|
| `historico_repo.py` *(futuro)* | Salvar e consultar históricos extraídos |
| `aluno_repo.py` *(futuro)* | CRUD de alunos |

> Nota: pelo contexto do projeto, o que será mais utilizado aqui (e talvez a única tarefa a ser executada em tempo de aplicação) é o Read de CRUD.

---

## Relação com as demais camadas

```
api/routes/       →  services/          →  model/domain/
(Controller HTTP)    (orquestração)         (regras puras)
                                        →  model/repositories/
                                            (persistência)
```

Os `schemas/` são usados tanto pelas rotas (validação de request/response) quanto pelos serviços (tipagem interna).
