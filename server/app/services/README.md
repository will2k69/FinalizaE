# Camada Services

A pasta `services/` concentra a **logica de aplicacao**, o core do backend.

Essa camada nao expoe HTTP diretamente e nao deve depender de detalhes de interface (como FastAPI), nem de persistencia acoplada. O objetivo dela e **orquestrar** o fluxo entre parser, model, repositorios etc.

---

## Responsabilidade principal

A camada de servicos deve:

- receber dados ja validados pelas rotas
- coordenar chamadas para modulos de dominio e infraestrutura
- aplicar regras de orquestracao (fluxo, selecao, montagem de resposta)
- devolver objetos tipados (schemas) para a camada de API

Ela **nao deve**:

- manipular request/response HTTP diretamente
- conter SQL embutido
- acessar qualquer detalhe de frontend

---

## Relacao com as demais camadas

```text
api/routes/  ->  services/  ->  model/domain/
                            ->  parsers/
                            ->  model/repositories/ (futuro)
```

- `api/routes/` cuida de HTTP
- `services/` cuida da orquestracao de caso de uso
- `model/` cuida de regras, contratos e persistencia
- `parsers/` cuida de extracao de dados externos

---

## Convencoes de implementacao

Para manter consistencia na pasta `services/`:

- um arquivo por caso de uso principal (ex.: extracao, recomendacao)
- nomes orientados a acao (`extract_*`, `generate_*`, `build_*`)
- funcoes com assinatura tipada
- sem efeitos colaterais desnecessarios
- sem dependencias de framework fora da camada de API
