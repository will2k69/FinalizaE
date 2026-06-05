from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class DisciplinaDados:
    id_disciplina: int
    codigo: str
    nome: str
    carga_horaria: int
    tipo: str
    turno: str
    periodo_ideal: int
    prerequisitos: list[str] = field(default_factory=list)
    corequisitos: list[str] = field(default_factory=list)
    enfases: list[str] = field(default_factory=list)


_DISCIPLINAS: list[dict[str, object]] = [
    {"codigo": "COMP359", "nome": "PROGRAMACAO 1", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 1},
    {"codigo": "COMP360", "nome": "LOGICA PARA PROGRAMACAO", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 1},
    {"codigo": "COMP361", "nome": "COMPUTACAO, SOCIEDADE E ETICA", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 1},
    {"codigo": "COMP362", "nome": "MATEMATICA DISCRETA", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 1},
    {"codigo": "COMP363", "nome": "CALCULO DIFERENCIAL E INTEGRAL", "carga_horaria": 144, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 1},
    {"codigo": "COMP364", "nome": "ESTRUTURA DE DADOS", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "M", "periodo_ideal": 2},
    {"codigo": "COMP365", "nome": "BANCO DE DADOS", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 2},
    {"codigo": "COMP366", "nome": "ORGANIZACAO E ARQUITETURA DE COMPUTADORES", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "M", "periodo_ideal": 2},
    {"codigo": "COMP367", "nome": "GEOMETRIA ANALITICA", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 2},
    {"codigo": "COMP368", "nome": "REDES DE COMPUTADORES", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 3},
    {"codigo": "COMP369", "nome": "TEORIA DOS GRAFOS", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 3},
    {"codigo": "COMP370", "nome": "PROBABILIDADE E ESTATISTICA", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "M", "periodo_ideal": 3},
    {"codigo": "COMP371", "nome": "ALGEBRA LINEAR", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "M", "periodo_ideal": 3},
    {"codigo": "COMP372", "nome": "PROGRAMACAO 2", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 4},
    {"codigo": "COMP373", "nome": "PROGRAMACAO 3", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 4},
    {"codigo": "COMP374", "nome": "PROJETO E ANALISE DE ALGORITMOS", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 4},
    {"codigo": "COMP376", "nome": "TEORIA DA COMPUTACAO", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 4},
    {"codigo": "COMP377", "nome": "ACE 1: PROJETO I", "carga_horaria": 75, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 4},
    {"codigo": "COMP378", "nome": "SISTEMAS OPERACIONAIS", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 5},
    {"codigo": "COMP379", "nome": "COMPILADORES", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 5},
    {"codigo": "COMP380", "nome": "INTELIGENCIA ARTIFICIAL", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 5},
    {"codigo": "COMP381", "nome": "COMPUTACAO GRAFICA", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 5},
    {"codigo": "COMP382", "nome": "PROJETO E DESENVOLVIMENTO DE SISTEMAS", "carga_horaria": 288, "tipo": "obrigatoria", "turno": "M", "periodo_ideal": 6},
    {"codigo": "COMP383", "nome": "ACE 2: CONTINUIDADE DO PROJETO", "carga_horaria": 75, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 4},
    {"codigo": "COMP384", "nome": "ACE 3: PROJETO 2", "carga_horaria": 73, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 4},
    {"codigo": "COMP385", "nome": "ACE 5: EVENTO", "carga_horaria": 73, "tipo": "obrigatoria", "turno": "M", "periodo_ideal": 4},
    {"codigo": "COMP386", "nome": "METODOLOGIA DE PESQUISA E TRABALHO INDIVIDUAL", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 7},
    {"codigo": "COMP387", "nome": "NOCOES DE DIREITO", "carga_horaria": 72, "tipo": "obrigatoria", "turno": "T", "periodo_ideal": 7},
    {"codigo": "COMP389", "nome": "CONCEITOS DE LINGUAGEM DE PROGRAMACAO", "carga_horaria": 72, "tipo": "eletiva", "turno": "T", "periodo_ideal": 8},
    {"codigo": "COMP390", "nome": "APRENDIZAGEM DE MAQUINA", "carga_horaria": 72, "tipo": "eletiva", "turno": "T", "periodo_ideal": 8},
    {"codigo": "COMP391", "nome": "SISTEMAS DIGITAIS", "carga_horaria": 72, "tipo": "eletiva", "turno": "T", "periodo_ideal": 8},
    {"codigo": "COMP392", "nome": "SISTEMAS DISTRIBUIDOS", "carga_horaria": 72, "tipo": "eletiva", "turno": "T", "periodo_ideal": 8},
    {"codigo": "COMP393", "nome": "REDES NEURAIS E APRENDIZADO PROFUNDO", "carga_horaria": 72, "tipo": "eletiva", "turno": "T", "periodo_ideal": 8},
    {"codigo": "COMP395", "nome": "INTERACAO HOMEM-MAQUINA", "carga_horaria": 72, "tipo": "eletiva", "turno": "M", "periodo_ideal": 8},
    {"codigo": "COMP396", "nome": "PROCESSAMENTO DIGITAL DE IMAGENS", "carga_horaria": 72, "tipo": "eletiva", "turno": "T", "periodo_ideal": 8},
    {"codigo": "COMP397", "nome": "COMPUTACAO EVOLUCIONARIA", "carga_horaria": 72, "tipo": "eletiva", "turno": "T", "periodo_ideal": 8},
    {"codigo": "COMP398", "nome": "SISTEMAS EMBARCADOS", "carga_horaria": 72, "tipo": "eletiva", "turno": "T", "periodo_ideal": 8},
    {"codigo": "COMP399", "nome": "GERENCIA DE PROJETO", "carga_horaria": 72, "tipo": "eletiva", "turno": "T", "periodo_ideal": 8},
    {"codigo": "COMP400", "nome": "INTELIGENCIA ARTIFICIAL", "carga_horaria": 72, "tipo": "eletiva", "turno": "T", "periodo_ideal": 8},
    {"codigo": "COMP401", "nome": "CIENCIA DE DADOS", "carga_horaria": 72, "tipo": "eletiva", "turno": "T", "periodo_ideal": 8},
    {"codigo": "COMP402", "nome": "MICROCONTROLADORES E APLICACOES", "carga_horaria": 72, "tipo": "eletiva", "turno": "T", "periodo_ideal": 8},
    {"codigo": "COMP403", "nome": "SEGURANCA DE SISTEMAS COMPUTACIONAIS", "carga_horaria": 72, "tipo": "eletiva", "turno": "T", "periodo_ideal": 8},
    {"codigo": "COMP404", "nome": "CALCULO 3", "carga_horaria": 72, "tipo": "eletiva", "turno": "T", "periodo_ideal": 8},
    {"codigo": "CC1941", "nome": "CALCULO 4", "carga_horaria": 72, "tipo": "eletiva", "turno": "M", "periodo_ideal": 8},
    {"codigo": "CC1942", "nome": "CALCULO NUMERICO", "carga_horaria": 72, "tipo": "eletiva", "turno": "T", "periodo_ideal": 8},
    {"codigo": "CC1943", "nome": "CIRCUITOS DIGITAIS", "carga_horaria": 72, "tipo": "eletiva", "turno": "T", "periodo_ideal": 8},
    {"codigo": "CC1945", "nome": "FUNDAMENTOS DE LIBRAS", "carga_horaria": 72, "tipo": "eletiva", "turno": "M", "periodo_ideal": 8},
    {"codigo": "CC1946", "nome": "GEOMETRIA COMPUTACIONAL", "carga_horaria": 72, "tipo": "eletiva", "turno": "M", "periodo_ideal": 8},
    {"codigo": "CC1958", "nome": "TOPICOS EM HUMANIDADES", "carga_horaria": 72, "tipo": "eletiva", "turno": "M", "periodo_ideal": 8},
    {"codigo": "COMP388", "nome": "ACE 4: CONTINUIDADE DO PROJETO 2", "carga_horaria": 75, "tipo": "obrigatoria", "turno": "N", "periodo_ideal": 4},
    {"codigo": "COMP409", "nome": "TOPICOS EM MATEMATICA PARA COMPUTACAO 1", "carga_horaria": 72, "tipo": "eletiva", "turno": "M", "periodo_ideal": 8},
    {"codigo": "COMP412", "nome": "TOPICOS EM FISICA PARA COMPUTACAO 1", "carga_horaria": 72, "tipo": "eletiva", "turno": "M", "periodo_ideal": 8},
]

_PREREQUISITOS: dict[str, list[str]] = {
    "COMP368": ["COMP359"],
    "COMP369": ["COMP362", "COMP364"],
    "COMP370": ["COMP363"],
    "COMP371": ["COMP367"],
    "COMP372": ["COMP364", "COMP365", "COMP368"],
    "COMP373": ["COMP364", "COMP365", "COMP368"],
    "COMP374": ["COMP364", "COMP369"],
    "COMP378": ["COMP366"],
    "COMP379": ["COMP364", "COMP376"],
    "COMP380": ["COMP360", "COMP364"],
    "COMP383": ["COMP377"],
    "COMP384": ["COMP377", "COMP383"],
    "COMP385": ["COMP377", "COMP383", "COMP384", "COMP388"],
    "COMP388": ["COMP377", "COMP383", "COMP384"],
    "COMP390": ["COMP404"],
    "COMP391": ["COMP404"],
    "COMP395": ["COMP373"],
    "COMP396": ["COMP381"],
    "COMP399": ["COMP382"],
    "COMP401": ["COMP370"],
    "COMP403": ["COMP368"],
    "COMP404": ["COMP363"],
    "CC1941": ["COMP404"],
    "CC1942": ["COMP363"],
}

_COREQUISITOS: dict[str, list[str]] = {
    "COMP372": ["COMP373"],
    "COMP373": ["COMP372"],
}

_ENFASES: dict[str, list[str]] = {
    "COMP404": ["computacao_visual", "sistemas_inteligentes", "sistemas_computacao"],
    "COMP390": ["computacao_visual", "sistemas_inteligentes"],
    "COMP393": ["computacao_visual", "sistemas_inteligentes", "sistemas_computacao"],
    "COMP396": ["computacao_visual"],
    "COMP400": ["computacao_visual"],
    "COMP397": ["sistemas_inteligentes"],
    "COMP401": ["sistemas_inteligentes"],
    "COMP391": ["sistemas_computacao"],
    "COMP398": ["sistemas_computacao"],
    "COMP402": ["sistemas_computacao"],
    "COMP389": ["sistemas_informacao"],
    "COMP392": ["sistemas_informacao"],
    "COMP395": ["sistemas_informacao"],
    "COMP399": ["sistemas_informacao"],
    "COMP403": ["sistemas_informacao"],
}


async def list_disciplinas_com_relacoes() -> list[DisciplinaDados]:
    retorno: list[DisciplinaDados] = []
    for idx, item in enumerate(_DISCIPLINAS, start=1):
        codigo = str(item["codigo"])
        retorno.append(
            DisciplinaDados(
                id_disciplina=idx,
                codigo=codigo,
                nome=str(item["nome"]),
                carga_horaria=int(item["carga_horaria"]),
                tipo=str(item["tipo"]),
                turno=str(item["turno"]),
                periodo_ideal=int(item["periodo_ideal"]),
                prerequisitos=list(_PREREQUISITOS.get(codigo, [])),
                corequisitos=list(_COREQUISITOS.get(codigo, [])),
                enfases=list(_ENFASES.get(codigo, [])),
            )
        )

    return sorted(retorno, key=lambda d: (d.periodo_ideal, d.tipo, d.codigo))


def list_codigos_catalogo() -> list[str]:
    return sorted({str(item["codigo"]) for item in _DISCIPLINAS})
