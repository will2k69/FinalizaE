from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dataclasses import dataclass, field, asdict
import typing

app = FastAPI()

# Permite que o Front-end (mesmo rodando em outra porta) acesse o Back-end
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, mudar para a URL do front
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@dataclass
class Disciplina:
    turno: str
    codigo: str
    nome: str
    CH: int
    tipo: str
    horario: dict[str, list[str]]
    periodo: int
    media: float = 0.0
    requisito: list[str] = field(default_factory=list) # Recebe como lista do JSON
    co_requisito: list[str] = field(default_factory=list)

@dataclass
class Aluno:
    nome: str
    matricula: str
    periodos_feitos: int
    dcp_feita: list[str] # Recebe como lista do JSON
    dcp_fazer: list[str]

@dataclass
class Periodo:                                                
    ch_total: int = 0
    Segunda: dict = field(default_factory=lambda: {f'M{i}': None for i in range(1, 7)} | {f'T{i}': None for i in range(1, 7)} | {f'N{i}': None for i in range(1, 4)})
    Terça: dict = field(default_factory=lambda: {f'M{i}': None for i in range(1, 7)} | {f'T{i}': None for i in range(1, 7)} | {f'N{i}': None for i in range(1, 4)})
    Quarta: dict = field(default_factory=lambda: {f'M{i}': None for i in range(1, 7)} | {f'T{i}': None for i in range(1, 7)} | {f'N{i}': None for i in range(1, 4)})
    Quinta: dict = field(default_factory=lambda: {f'M{i}': None for i in range(1, 7)} | {f'T{i}': None for i in range(1, 7)} | {f'N{i}': None for i in range(1, 4)})
    Sexta: dict = field(default_factory=lambda: {f'M{i}': None for i in range(1, 7)} | {f'T{i}': None for i in range(1, 7)} | {f'N{i}': None for i in range(1, 4)})
    Sábado: dict = field(default_factory=lambda: {f'M{i}': None for i in range(1, 7)} | {f'T{i}': None for i in range(1, 7)} | {f'N{i}': None for i in range(1, 4)})

# --- A REGRA DE NEGÓCIO ---
def rodar_algoritmo_aconselhamento(aluno: Aluno, dcp_colocar: list[Disciplina], ch_limite: int) -> Periodo:
    periodo_aconselhar = Periodo()
    
    # Convertendo as listas do aluno para SET para manter sua otimização O(1)
    dcp_feita_set = set(aluno.dcp_feita)

    for dcp in dcp_colocar:
        # Critério 1: Limite de Carga Horária
        if periodo_aconselhar.ch_total + dcp.CH <= ch_limite:   
            
            # Critério 2: Pré-requisitos (convertendo o requisito da dcp para set aqui)
            if set(dcp.requisito).issubset(dcp_feita_set):
                
                # Critério 3: Choque de horário
                n_pode_colocar_horario = 0
                for dia, horarios_codigos in dcp.horario.items():
                    agenda_dia = getattr(periodo_aconselhar, dia)
                    
                    for horario in horarios_codigos:
                        if agenda_dia.get(horario) is not None:
                            n_pode_colocar_horario = 1
                            break
                    
                    if n_pode_colocar_horario == 1:
                        break

                # Se passou nos 3 critérios, adiciona na grade
                if n_pode_colocar_horario == 0:
                    for dia, horarios_codigos in dcp.horario.items():
                        agenda_dia = getattr(periodo_aconselhar, dia)
                        for horario in horarios_codigos:
                            agenda_dia[horario] = dcp.codigo

                    periodo_aconselhar.ch_total += dcp.CH
                    
    return periodo_aconselhar

# --- ENDPOINT DA API ---
@app.post("/api/aconselhar")
def aconselhar_aluno(aluno: Aluno, disciplinas: list[Disciplina], ch_limite: int = 540):
    # Executa a lógica
    resultado = rodar_algoritmo_aconselhamento(aluno, disciplinas, ch_limite)
    # Retorna o resultado como um JSON puro para o Front-end
    return asdict(resultado)