# Camada API

A pasta api/ representa a camada de entrada HTTP do backend.

Ela recebe requisicoes do frontend, valida dados de entrada, chama os servicos de aplicacao e devolve respostas padronizadas.

---

## Responsabilidade principal

A camada de API deve:

- expor endpoints REST
- validar formato de entrada (content-type, campos obrigatorios, parametros)
- delegar a regra de negocio para app/services/
- converter erros de dominio para codigos HTTP apropriados
- devolver response models definidos em app/model/schemas/

Ela nao deve:

- conter parsing de PDF
- conter regra de recomendacao
- conter logica de acesso a banco

---

## Estrutura interna

### routes/

Subpasta com os modulos de rotas por contexto funcional.

---

## Relacao com as demais camadas

```text
view/javascript/pages/*  ->  api/routes/*  ->  services/*
                                           ->  model/schemas/*
```

- O frontend fala com a API por HTTP
- A API conversa com services por chamadas Python
- A API usa schemas para padronizar contratos

---

## Convencoes de implementacao

Para manter consistencia na pasta api/:

- um router por contexto de negocio
- prefixo unico por grupo de rotas (ex.: /api)
- sem regra de negocio dentro da rota
- tipos e response_model sempre que possivel
- erros previsiveis com HTTPException e mensagens claras
- manter endpoints pequenos e orientados a caso de uso
