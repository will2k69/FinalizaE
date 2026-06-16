/**
 * Tela de exploração da estrutura curricular (PPC).
 * * Funcionalidade:
 * 1. Consome o catálogo oficial do PostgreSQL via API de forma isolada.
 * 2. Agrupa as disciplinas por períodos ideais.
 * 3. Se a API falhar, o modo de contingência local entra em ação automaticamente.
 */

// Resiliência de rota base integrada ao ecossistema do seu projeto
const BASE_URL = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://127.0.0.1:8000';
const API_URL = `${BASE_URL}/api/disciplinas/`;

/** @type {HTMLSelectElement} Seletor do curso */
const courseSelect = document.getElementById("courseSelect");

/** @type {HTMLSelectElement} Seletor de período */
const periodFilter = document.getElementById("periodFilter");

/** @type {HTMLInputElement} Campo de busca textual */
const searchInput = document.getElementById("searchInput");

/** @type {HTMLElement} Contêiner onde os cartões de período são injetados */
const periodsContainer = document.getElementById("periodsContainer");

/** @type {HTMLElement} Parágrafo de resumo de resultados visíveis */
const summaryText = document.getElementById("summaryText");

/** @type {HTMLElement} Nota sobre o ano de referência do PPC */
const ppcNote = document.getElementById("ppcNote");

/** Rótulos dos cursos cadastrados no PPC */
const courseLabels = {
    "ciencia-computacao": "Ciência da Computação",
    "engenharia-computacao": "Engenharia da Computação",
    "inteligencia-artificial": "Inteligência Artificial"
};

// Alterado para evitar conflito de redeclaração com o ppc_data.js antigo
let dadosPpcCursos = {};

function removeAcentos(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalize(value) {
    return removeAcentos(value.toLowerCase().trim());
}

/** Determina o curso inicial com base nos dados reais disponíveis */
function getInitialCourse() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("curso");

    if (fromQuery && dadosPpcCursos[fromQuery]) {
        return fromQuery;
    }
    return "ciencia-computacao";
}

function createCourseOption(value, label) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
}

function populateCourseSelect() {
    courseSelect.innerHTML = "";
    Object.entries(courseLabels).forEach(([value, label]) => {
        courseSelect.appendChild(createCourseOption(value, label));
    });
}

function populatePeriodFilter(periodos) {
    periodFilter.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "todos";
    allOption.textContent = "Por período";
    periodFilter.appendChild(allOption);

    if (!periodos) return;

    periodos.forEach((periodo) => {
        const option = document.createElement("option");
        option.value = String(periodo.numero);
        option.textContent = `${periodo.numero}º Período`;
        periodFilter.appendChild(option);
    });
}

function disciplinaAtendeBusca(disciplina, termoBusca) {
    if (!termoBusca) return true;

    const nome = normalize(disciplina.nome);
    const codigo = normalize(disciplina.codigo);

    return nome.includes(termoBusca) || codigo.includes(termoBusca);
}

function renderDisciplinaItem(disciplina) {
    return `
        <li class="subject-item">
            <div class="subject-main">
                <strong>${disciplina.codigo} - ${disciplina.nome}</strong>
                <span class="subject-meta">CH: ${disciplina.ch}h</span>
            </div>
        </li>
    `;
}

function renderEmptyState(courseName) {
    periodsContainer.innerHTML = `
        <div class="empty-state">
            <h3>Nenhuma disciplina encontrada</h3>
            <p>Refine os filtros ou selecione outro curso para visualizar a matriz de ${courseName}.</p>
        </div>
    `;
}

function renderPeriods() {
    const selectedCourse = courseSelect.value;
    const selectedPeriod = periodFilter.value;
    const searchTerm = normalize(searchInput.value);

    const course = dadosPpcCursos[selectedCourse];
    if (!course || !course.periodos) {
        renderEmptyState(courseLabels[selectedCourse] || selectedCourse);
        if (summaryText) summaryText.textContent = "0 período(s) visível(is), 0 disciplina(s).";
        return;
    }

    const periodos = course.periodos;

    if (ppcNote) {
        ppcNote.textContent = `* Matriz curricular sincronizada e ativa no sistema.`;
    }

    const periodosFiltrados = periodos
        .filter((periodo) => selectedPeriod === "todos" || String(periodo.numero) === selectedPeriod)
        .map((periodo) => {
            const disciplinasFiltradas = periodo.disciplinas.filter((disciplina) =>
                disciplinaAtendeBusca(disciplina, searchTerm)
            );

            return {
                numero: periodo.numero,
                disciplinas: disciplinasFiltradas
            };
        })
        .filter((periodo) => periodo.disciplinas.length > 0);

    const totalDisciplinas = periodosFiltrados.reduce((acc, periodo) => acc + periodo.disciplinas.length, 0);
    summaryText.textContent = `${course.nome}: ${periodosFiltrados.length} período(s) visível(is), ${totalDisciplinas} disciplina(s).`;

    if (periodosFiltrados.length === 0) {
        renderEmptyState(course.nome);
        return;
    }

    periodsContainer.innerHTML = periodosFiltrados
        .map((periodo, index) => {
            const disciplinasHtml = periodo.disciplinas.map(renderDisciplinaItem).join("");

            return `
                <article class="period-card">
                    <button class="period-header" type="button" aria-expanded="${index === 0 ? "true" : "false"}">
                        <div>
                            <h3>${periodo.numero}º Período</h3>
                            <p>${periodo.disciplinas.length} disciplina(s)</p>
                        </div>
                        <span class="chevron" aria-hidden="true"></span>
                    </button>
                    <div class="period-content">
                        <ul class="subject-list">${disciplinasHtml}</ul>
                    </div>
                </article>
            `;
        })
        .join("");

    attachAccordionBehavior();
}

function attachAccordionBehavior() {
    const headers = document.querySelectorAll(".period-header");
    headers.forEach((header) => {
        header.addEventListener("click", () => {
            const card = header.closest(".period-card");
            const isOpen = card.classList.contains("open");

            card.classList.toggle("open", !isOpen);
            header.setAttribute("aria-expanded", String(!isOpen));
        });
    });
}

function setInitialState() {
    populateCourseSelect();

    const initialCourse = getInitialCourse();
    courseSelect.value = initialCourse;

    const cursoAtivo = dadosPpcCursos[initialCourse];
    const periodos = cursoAtivo ? cursoAtivo.periodos : [];
    populatePeriodFilter(periodos);

    renderPeriods();
}

/** Agrupa a lista plana vinda do banco em uma árvore estruturada por períodos */
function processarEExibirDisciplinas(listaCrua) {
    dadosPpcCursos = {
        "ciencia-computacao": { nome: "Ciência da Computação", anoPpc: "Atual", periodos: [] },
        "engenharia-computacao": { nome: "Engenharia da Computação", anoPpc: "Atual", periodos: [] },
        "inteligencia-artificial": { nome: "Inteligência Artificial", anoPpc: "Atual", periodos: [] }
    };

    const periodosMapa = {};

    listaCrua.forEach(disc => {
        const pNum = disc.periodo_ideal || 1;
        if (!periodosMapa[pNum]) {
            periodosMapa[pNum] = [];
        }
        periodosMapa[pNum].push({
            codigo: disc.codigo,
            nome: disc.nome,
            ch: disc.carga_horaria || disc.ch || 72
        });
    });

    Object.keys(periodosMapa).sort((a, b) => a - b).forEach(pNum => {
        dadosPpcCursos["ciencia-computacao"].periodos.push({
            numero: parseInt(pNum),
            disciplinas: periodosMapa[pNum]
        });
    });

    setInitialState();
}

// ─── CONEXÃO CENTRAL DE SEGURANÇA ──────────────────────────────────────
async function sincronizarPpcComBanco() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const disciplinasDoBanco = await response.json();
        processarEExibirDisciplinas(disciplinasDoBanco);

    } catch (error) {
        console.warn("API offline ou em atualização. Ativando dados locais de segurança.", error);
        
        // Carga local de contingência imediata caso a API lance o erro de tabela ausente
        const dadosLocaisDeSeguranca = [
            { codigo: "COMP359", nome: "PROGRAMAÇÃO I", periodo_ideal: 1, carga_horaria: 72 },
            { codigo: "COMP360", nome: "LÓGICA PARA PROGRAMAÇÃO", periodo_ideal: 1, carga_horaria: 72 },
            { codigo: "COMP362", nome: "MATEMÁTICA DISCRETA", periodo_ideal: 1, carga_horaria: 72 },
            { codigo: "COMP363", nome: "CÁLCULO DIFERENCIAL E INTEGRAL", periodo_ideal: 1, carga_horaria: 144 },
            { codigo: "COMP364", nome: "ESTRUTURA DE DADOS", periodo_ideal: 2, carga_horaria: 72 },
            { codigo: "COMP365", nome: "BANCO DE DADOS", periodo_ideal: 2, carga_horaria: 72 },
            { codigo: "COMP366", nome: "ORGANIZAÇÃO E ARQUITETURA DE COMPUTADORES", periodo_ideal: 2, carga_horaria: 72 },
            { codigo: "COMP368", nome: "REDES DE COMPUTADORES", periodo_ideal: 3, carga_horaria: 72 },
            { codigo: "COMP369", nome: "TEORIA DOS GRAFOS", periodo_ideal: 3, carga_horaria: 72 }
        ];

        processarEExibirDisciplinas(dadosLocaisDeSeguranca);
    }
}

// ─── Listeners de eventos ────────────────────────────────────────────────────
courseSelect.addEventListener("change", () => {
    const cursoAtivo = dadosPpcCursos[courseSelect.value];
    const periodos = cursoAtivo ? cursoAtivo.periodos : [];
    populatePeriodFilter(periodos);
    renderPeriods();
});

periodFilter.addEventListener("change", renderPeriods);
searchInput.addEventListener("input", renderPeriods);

document.getElementById("exportPdfBtn").addEventListener("click", () => {
    document.querySelectorAll(".period-card").forEach((card) => {
        card.classList.add("open");
        const header = card.querySelector(".period-header");
        if (header) header.setAttribute("aria-expanded", "true");
    });
    window.print();
});

// Inicialização
sincronizarPpcComBanco();