/**
 * Popula os seletores de curso e período a partir dos dados fixos em `ppc_data.js`.
 * Filtrar disciplinas por termo de busca (nome, código ou pré-requisito) e por período.
 * Exportar a grade curricular visível para PDF via `window.print()`.
 */

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

/**
 * Mapa de chave para rótulo legível dos cursos disponíveis.
 * As chaves devem corresponder exatamente às chaves em `PPC_DATA`.
 * @type {Record<string, string>}
 */
const courseLabels = {
    "ciencia-computacao": "Ciência da Computação",
    "engenharia-computacao": "Engenharia da Computação",
    "inteligencia-artificial": "Inteligência Artificial"
};


function removeAcentos(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalize(value) {
    return removeAcentos(value.toLowerCase().trim());
}

/**
 * Determina o curso a ser exibido na carga inicial da página.
 * Lê o parâmetro `?curso=` da query string; se ausente ou inválido, retorna o curso padrão.
 * @returns {string} Chave do curso inicial (ex: `"ciencia-computacao"`).
 */
function getInitialCourse() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("curso");

    if (fromQuery && PPC_DATA[fromQuery]) {
        return fromQuery;
    }

    return "ciencia-computacao";
}

/**
 * Cria um elemento `<option>` para um seletor HTML.
 * @param {string} value - Valor do atributo `value`.
 * @param {string} label - Texto visível da opção.
 * @returns {HTMLOptionElement}
 */
function createCourseOption(value, label) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
}

/**
 * Popula o seletor de cursos (`#courseSelect`) com todas as entradas de `courseLabels`.
 */
function populateCourseSelect() {
    Object.entries(courseLabels).forEach(([value, label]) => {
        courseSelect.appendChild(createCourseOption(value, label));
    });
}

/**
 * Reconstrói as opções do seletor de período (`#periodFilter`) para o conjunto de períodos fornecido.
 * Sempre inclui a opção "Por período" (valor `"todos"`) no início.
 * @param {{ numero: number }[]} periodos - Lista de períodos do curso selecionado.
 */
function populatePeriodFilter(periodos) {
    periodFilter.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "todos";
    allOption.textContent = "Por período";
    periodFilter.appendChild(allOption);

    periodos.forEach((periodo) => {
        const option = document.createElement("option");
        option.value = String(periodo.numero);
        option.textContent = `${periodo.numero}º Período`;
        periodFilter.appendChild(option);
    });
}

/**
 * Verifica se uma disciplina atende ao termo de busca informado.
 * A comparação é feita de forma normalizada (sem acentos, sem distinção de maiúsculas)
 * nos campos nome, código e lista de pré-requisitos.
 * @param {{ nome: string, codigo: string, prerequisitos: string[] }} disciplina - Objeto da disciplina.
 * @param {string} termoBusca - Termo já normalizado via `normalize()`.
 * @returns {boolean} `true` se a disciplina corresponde ao termo de busca.
 */
function disciplinaAtendeBusca(disciplina, termoBusca) {
    if (!termoBusca) return true;

    const nome = normalize(disciplina.nome);
    const codigo = normalize(disciplina.codigo);
    const prerequisitos = normalize((disciplina.prerequisitos || []).join(" "));

    return nome.includes(termoBusca) || codigo.includes(termoBusca) || prerequisitos.includes(termoBusca);
}

/**
 * Gera o HTML de um item de disciplina para a lista de um período.
 * @param {{ codigo: string, nome: string, ch: number, prerequisitos: string[] }} disciplina - Dados da disciplina.
 * @returns {string} Fragmento HTML do elemento `<li>`.
 */
function renderDisciplinaItem(disciplina) {
    const prerequisitos = disciplina.prerequisitos && disciplina.prerequisitos.length > 0
        ? disciplina.prerequisitos.join(", ")
        : "Nenhum";

    return `
        <li class="subject-item">
            <div class="subject-main">
                <strong>${disciplina.codigo} - ${disciplina.nome}</strong>
                <span class="subject-meta">CH: ${disciplina.ch}h</span>
            </div>
            <p class="subject-prereq">Pré-requisitos: ${prerequisitos}</p>
        </li>
    `;
}

/**
 * Exibe uma mensagem de estado vazio em `#periodsContainer` quando nenhum resultado é encontrado.
 * @param {string} courseName - Nome legível do curso, usado na mensagem informativa.
 */
function renderEmptyState(courseName) {
    periodsContainer.innerHTML = `
        <div class="empty-state">
            <h3>Nenhuma disciplina encontrada</h3>
            <p>Refine os filtros ou selecione outro curso para visualizar o PPC de ${courseName}.</p>
        </div>
    `;
}

/**
 * Lê o estado atual dos filtros (curso, período e busca textual), aplica os filtros sobre
 * os dados do `PPC_DATA`, e re-renderiza o `#periodsContainer` com os resultados.
 * O primeiro período visível começa expandido.
 * Ao final, registra os listeners de acordeão nos novos elementos gerados.
 */
function renderPeriods() {
    const selectedCourse = courseSelect.value;
    const selectedPeriod = periodFilter.value;
    const searchTerm = normalize(searchInput.value);

    const course = PPC_DATA[selectedCourse];
    const periodos = course.periodos;

    if (ppcNote) {
        ppcNote.textContent = `* Baseado no PPC vigente de ${course.anoPpc}.`;
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

/**
 * Registra o comportamento de acordeão (abrir/fechar) nos botões `.period-header`
 * presentes no DOM no momento da chamada.
 * Deve ser invocada sempre após re-renderizar `#periodsContainer`.
 */
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

/**
 * Inicializa a página, popula os seletores, aplica o curso vindo da query string e dispara a primeira renderização.
 */
function setInitialState() {
    populateCourseSelect();

    const initialCourse = getInitialCourse();
    courseSelect.value = initialCourse;

    const periodos = PPC_DATA[initialCourse].periodos;
    populatePeriodFilter(periodos);

    renderPeriods();
}

// ─── Listeners de eventos ────────────────────────────────────────────────────

courseSelect.addEventListener("change", () => {
    const periodos = PPC_DATA[courseSelect.value].periodos;
    populatePeriodFilter(periodos);
    renderPeriods();
});

periodFilter.addEventListener("change", renderPeriods);
searchInput.addEventListener("input", renderPeriods);

/**
 * Ao clicar em "Exportar PDF", expande todos os períodos para garantir que o conteúdo
 * dos acordeões apareça na impressão, depois aciona o diálogo de impressão/PDF do navegador.
 * Aqui usa 'window.print' -> muito básico TODO: melhorar
 */
document.getElementById("exportPdfBtn").addEventListener("click", () => {
    document.querySelectorAll(".period-card").forEach((card) => {
        card.classList.add("open");
        const header = card.querySelector(".period-header");
        if (header) header.setAttribute("aria-expanded", "true");
    });

    window.print();
});


setInitialState();