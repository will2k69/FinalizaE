"""Serviço de geração de recomendação de disciplinas.

Responsável por toda a lógica de planejamento acadêmico: normalização do
histórico do aluno, montagem do objetivo (o que ainda precisa ser cursado),
e alocação greedy de disciplinas semestre a semestre respeitando
pré-requisitos, co-requisitos e limite de carga horária.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.model.repositories.recomendacao_repository import (
    DisciplinaDados,
    list_disciplinas_com_relacoes,
)
from app.model.schemas.recomendacao import (
    DisciplinaCursadaIn,
    DisciplinaRecomendadaOut,
    PendenciaOut,
    PeriodoPlanoOut,
    TipoPrioridade,
    RecomendacaoRequest,
    RecomendacaoResponse,
)


NOTA_APROVACAO = 7.0


@dataclass
class EstadoHistorico:
    aprovadas: set[str]
    cursando: set[str]


def _periodo_to_index(periodo: str) -> int:
    """Converte um período no formato 'AAAA.S' para um índice inteiro.

    Exemplo: '2026.1' → 4053, '2026.2' → 4054.
    Usado para calcular distância e ordem entre períodos.
    """
    ano = int(periodo[:4])
    semestre = int(periodo[5])
    return (ano * 2) + (semestre - 1)


def _index_to_periodo(index: int) -> str:
    """Operação inversa de _periodo_to_index: índice inteiro → 'AAAA.S'."""
    ano = index // 2
    semestre = (index % 2) + 1
    return f"{ano}.{semestre}"


def _proximos_periodos(periodo_atual: str, prazo_conclusao: str) -> list[str]:
    """Retorna a lista ordenada de períodos futuros entre periodo_atual (exclusive)
    e prazo_conclusao (inclusive).

    Retorna lista vazia se prazo_conclusao <= periodo_atual.
    """
    atual_idx = _periodo_to_index(periodo_atual)
    prazo_idx = _periodo_to_index(prazo_conclusao)
    if prazo_idx <= atual_idx:
        return []
    return [_index_to_periodo(i) for i in range(atual_idx + 1, prazo_idx + 1)]


def _normaliza_historico(historico: list[DisciplinaCursadaIn]) -> EstadoHistorico:
    """Classifica o histórico do aluno em dois conjuntos:

    - ``aprovadas``: status 'concluida'.
    - ``cursando``: status 'cursando' (não serão reofertadas neste ciclo).

    Disciplinas reprovadas ou sem status reconhecido são ignoradas e ficam
    disponíveis para recomendação.
    """
    aprovadas: set[str] = set()
    cursando: set[str] = set()

    for item in historico:
        codigo = item.codigo
        if item.status == "concluida":
            aprovadas.add(codigo)
        elif item.status == "cursando":
            cursando.add(codigo)

    return EstadoHistorico(aprovadas=aprovadas, cursando=cursando)


def _is_enfase_alvo(disciplina: DisciplinaDados, enfase: str) -> bool:
    """Retorna True se a disciplina pertence à ênfase escolhida pelo aluno."""
    return enfase in disciplina.enfases


def _tipo_peso(tipo: str) -> int:
    """Retorna peso numérico para ordenação por tipo de disciplina.

    obrigatoria=0 (maior prioridade), eletiva=1, demais=2.
    """
    if tipo == "obrigatoria":
        return 0
    if tipo == "eletiva":
        return 1
    return 2


def _ordena_candidatas(candidatas: list[DisciplinaDados], enfase: str) -> list[DisciplinaDados]:
    """Ordena as disciplinas candidatas para alocação em um período.

    Critérios em ordem de prioridade:
    1. Pertence à ênfase escolhida (sim antes de não).
    2. Tipo: obrigatória ou eletiva.
    3. Período ideal do PPC (sequência natural do curso).
    4. Código (desempate alfabético/numérico).
    """
    return sorted(
        candidatas,
        key=lambda d: (
            0 if _is_enfase_alvo(d, enfase) else 1,
            _tipo_peso(d.tipo),
            d.periodo_ideal,
            d.codigo,
        ),
    )


def _peso_prioridade(disciplina: DisciplinaDados, prioridade: TipoPrioridade, enfase: str) -> int:
    if prioridade == TipoPrioridade.obrigatorias:
        return 0 if disciplina.tipo == "obrigatoria" else 1
    if prioridade == TipoPrioridade.eletivas:
        if disciplina.tipo == "eletiva" and _is_enfase_alvo(disciplina, enfase):
            return 0
        if disciplina.tipo == "eletiva":
            return 1
        return 2
    return 1


def _ordena_candidatas_por_prioridade(
    candidatas: list[DisciplinaDados],
    enfase: str,
    prioridade: TipoPrioridade,
) -> list[DisciplinaDados]:
    return sorted(
        candidatas,
        key=lambda d: (
            _peso_prioridade(d, prioridade, enfase),
            0 if _is_enfase_alvo(d, enfase) else 1,
            _tipo_peso(d.tipo),
            d.periodo_ideal,
            d.codigo,
        ),
    )


def _prerequisitos_ok(disciplina: DisciplinaDados, aprovadas: set[str]) -> tuple[bool, list[str]]:
    """Verifica se todos os pré-requisitos da disciplina já foram aprovados.
    """
    pendentes = [pre for pre in disciplina.prerequisitos if pre not in aprovadas]
    return (len(pendentes) == 0, pendentes)


def _corequisitos_ok(disciplina: DisciplinaDados, aprovadas: set[str], alocadas_periodo: set[str]) -> bool:
    """Verifica se os co-requisitos estão satisfeitos.

    Um co-requisito é satisfeito se o código correspondente já está em
    ``aprovadas`` (cursou antes) ou em ``alocadas_periodo`` (está sendo
    alocado no mesmo semestre simulado).
    """
    if not disciplina.corequisitos:
        return True
    for codigo in disciplina.corequisitos:
        if codigo in aprovadas or codigo in alocadas_periodo:
            continue
        return False
    return True


def _disciplinas_pendentes(
    disciplinas: list[DisciplinaDados],
    aprovadas: set[str],
    minimo_eletivas_enfase: int,
    enfase: str,
) -> list[DisciplinaDados]:
    """Monta o conjunto-objetivo: tudo que o aluno ainda precisa cursar.

    Composto por:
    - Todas as obrigatórias ainda não aprovadas.
    - Até ``minimo_eletivas_enfase`` eletivas da ênfase escolhida,
      priorizadas pelo período ideal (as mais iniciais primeiro).

    Eletivas de outras ênfases são descartadas nesta fase.
    """
    obrigatorias = [d for d in disciplinas if d.tipo == "obrigatoria" and d.codigo not in aprovadas]

    eletivas_enfase = [
        d
        for d in disciplinas
        if d.tipo == "eletiva" and d.codigo not in aprovadas and _is_enfase_alvo(d, enfase)
    ]

    eletivas_enfase = sorted(eletivas_enfase, key=lambda d: (d.periodo_ideal, d.codigo))
    eletivas_escolhidas = eletivas_enfase[:minimo_eletivas_enfase]

    retorno: dict[str, DisciplinaDados] = {}
    for d in obrigatorias + eletivas_escolhidas:
        retorno[d.codigo] = d

    return list(retorno.values())


async def calcular_carga_minima_viavel(
    periodo_atual: str,
    prazo_conclusao: str,
    historico: list[DisciplinaCursadaIn],
    enfase: str,
    minimo_eletivas_enfase: int,
) -> int:
    """Calcula carga horária mínima por período para viabilizar conclusão no prazo.

    Regra: soma a carga horária de todas as disciplinas do objetivo e divide
    pela quantidade de períodos restantes (exclusive atual, inclusive prazo),
    arredondando para cima.
    """
    periodos = _proximos_periodos(periodo_atual, prazo_conclusao)
    if not periodos:
        return 72

    estado = _normaliza_historico(historico)
    disciplinas = await list_disciplinas_com_relacoes()
    objetivo = _disciplinas_pendentes(
        disciplinas=disciplinas,
        aprovadas=estado.aprovadas,
        minimo_eletivas_enfase=minimo_eletivas_enfase,
        enfase=enfase,
    )

    carga_total_restante = sum(d.carga_horaria for d in objetivo if d.codigo not in estado.cursando)
    periodos_restantes = len(periodos)
    if periodos_restantes <= 0:
        return 72

    # Arredondamento para cima sem importar math.
    carga_minima = (carga_total_restante + periodos_restantes - 1) // periodos_restantes
    return max(72, min(576, int(carga_minima)))


async def gerar_recomendacao(
    payload: RecomendacaoRequest,
) -> RecomendacaoResponse:
    """Gera o plano de recomendação semestral para o aluno.

    Algoritmo greedy semestre a semestre:
    1. Calcula os períodos futuros entre periodo_atual e prazo_conclusao.
    2. Normaliza o histórico em aprovadas/cursando.
    3. Monta o objetivo (obrigatórias pendentes + eletivas da ênfase).
    4. Para cada período futuro:
       a. Lista candidatas (objetivo faltante, excluindo as que estão cursando).
       b. Ordena por: ênfase > tipo > periodo_ideal > código.
       c. Loop interno: tenta alocar cada candidata verificando pré-requisitos,
          co-requisitos e limite de carga horária. Repete até não haver mais
          progresso (nenhuma nova disciplina alocável no semestre).
       d. Disciplinas alocadas passam para aprovadas, desbloqueando
          pré-requisitos para os próximos períodos.
    5. Disciplinas que não couberam em nenhum período viram pendências
       com motivo descritivo (pré-req ainda pendente ou falta de janela).

    Raises:
        ValueError: propagado pelo schema se o payload for inválido.
    """
    periodos = _proximos_periodos(payload.periodo_atual, payload.prazo_conclusao)
    if not periodos:
        return RecomendacaoResponse(
            enfase=payload.enfase,
            periodo_atual=payload.periodo_atual,
            prazo_conclusao=payload.prazo_conclusao,
            periodos_planejados=[],
            pendencias=[],
        )

    historico = _normaliza_historico(payload.historico)
    disciplinas = await list_disciplinas_com_relacoes()

    objetivo = _disciplinas_pendentes(
        disciplinas=disciplinas,
        aprovadas=historico.aprovadas,
        minimo_eletivas_enfase=payload.minimo_eletivas_enfase,
        enfase=payload.enfase.value,
    )

    objetivo_por_codigo = {d.codigo: d for d in objetivo}
    faltantes: set[str] = set(objetivo_por_codigo.keys())

    periodos_out: list[PeriodoPlanoOut] = []

    for periodo in periodos:
        ch_total = 0
        alocadas: list[DisciplinaRecomendadaOut] = []
        alocadas_codigos: set[str] = set()

        candidatas_brutas = [
            objetivo_por_codigo[codigo]
            for codigo in faltantes
            if codigo not in historico.cursando
        ]
        candidatas = _ordena_candidatas_por_prioridade(
            candidatas=candidatas_brutas,
            enfase=payload.enfase.value,
            prioridade=payload.prioridade,
        )

        progresso = True
        while progresso:
            progresso = False
            for disciplina in candidatas:
                if disciplina.codigo in alocadas_codigos:
                    continue

                if ch_total + disciplina.carga_horaria > payload.carga_horaria_max_por_periodo:
                    continue

                prereq_ok, _ = _prerequisitos_ok(disciplina, historico.aprovadas)
                if not prereq_ok:
                    continue

                if not _corequisitos_ok(disciplina, historico.aprovadas, alocadas_codigos):
                    continue

                alocadas.append(
                    DisciplinaRecomendadaOut(
                        codigo=disciplina.codigo,
                        nome=disciplina.nome,
                        carga_horaria=disciplina.carga_horaria,
                        tipo=disciplina.tipo,
                        periodo_ideal=disciplina.periodo_ideal,
                        prioridade_enfase=_is_enfase_alvo(disciplina, payload.enfase.value),
                        prerequisitos_pendentes=[],
                    )
                )
                alocadas_codigos.add(disciplina.codigo)
                ch_total += disciplina.carga_horaria
                progresso = True

        if alocadas:
            for codigo in alocadas_codigos:
                faltantes.discard(codigo)
                historico.aprovadas.add(codigo)

        periodos_out.append(
            PeriodoPlanoOut(
                periodo=periodo,
                carga_horaria_total=ch_total,
                disciplinas=alocadas,
            )
        )

    pendencias: list[PendenciaOut] = []
    for codigo in sorted(faltantes):
        disciplina = objetivo_por_codigo[codigo]
        _, prereq_pendentes = _prerequisitos_ok(disciplina, historico.aprovadas)

        if prereq_pendentes:
            motivo = f"Prerequisitos pendentes: {', '.join(prereq_pendentes)}"
        else:
            motivo = "Outros motivos"

        pendencias.append(
            PendenciaOut(
                codigo=disciplina.codigo,
                nome=disciplina.nome,
                motivo=motivo,
            )
        )

    return RecomendacaoResponse(
        enfase=payload.enfase,
        periodo_atual=payload.periodo_atual,
        prazo_conclusao=payload.prazo_conclusao,
        periodos_planejados=periodos_out,
        pendencias=pendencias,
    )
