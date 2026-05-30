/**
 * Tela de preenchimento manual do histórico.
 */
const API_URL = `${API_BASE_URL}/api/disciplinas`;
const MAX_SUGGESTIONS = 8;

let currentRowToUpdate = null;
let disciplinasDisponiveis = [];
let carregandoDisciplinas = true;
let erroAoCarregarDisciplinas = null;

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeText(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function ordenarDisciplinas(a, b) {
    return a.codigo.localeCompare(b.codigo, 'pt-BR', {
        numeric: true,
        sensitivity: 'base'
    });
}

function atualizarFeedbackDisciplinas(message, status = 'idle') {
    const feedback = document.getElementById('disciplinas-feedback');

    if (!feedback) return;

    feedback.textContent = message;
    feedback.className = 'disciplinas-feedback';

    if (status === 'error') feedback.classList.add('is-error');
    if (status === 'success') feedback.classList.add('is-success');
}

async function carregarDisciplinas() {
    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const disciplinas = await response.json();

    disciplinasDisponiveis = disciplinas.sort(ordenarDisciplinas);
}

function encontrarDisciplinaExata(searchTerm) {
    const normalizedTerm = normalizeText(searchTerm);

    if (!normalizedTerm) return null;

    return disciplinasDisponiveis.find((disciplina) => {
        const codigoNormalizado = normalizeText(disciplina.codigo);
        const nomeNormalizado = normalizeText(disciplina.nome);

        return (
            codigoNormalizado === normalizedTerm ||
            nomeNormalizado === normalizedTerm
        );
    }) ?? null;
}

function buscarDisciplinas(searchTerm) {
    if (carregandoDisciplinas) return [];

    const normalizedTerm = normalizeText(searchTerm);

    if (!normalizedTerm) {
        return disciplinasDisponiveis.slice(0, MAX_SUGGESTIONS);
    }

    return disciplinasDisponiveis
        .map((disciplina) => {
            const codigoNormalizado = normalizeText(disciplina.codigo);
            const nomeNormalizado = normalizeText(disciplina.nome);

            let score = Number.POSITIVE_INFINITY;

            if (codigoNormalizado.startsWith(normalizedTerm)) score = 0;
            else if (nomeNormalizado.startsWith(normalizedTerm)) score = 1;
            else if (codigoNormalizado.includes(normalizedTerm)) score = 2;
            else if (nomeNormalizado.includes(normalizedTerm)) score = 3;

            return { disciplina, score };
        })
        .filter(({ score }) => Number.isFinite(score))
        .sort((a, b) =>
            a.score - b.score ||
            ordenarDisciplinas(a.disciplina, b.disciplina)
        )
        .slice(0, MAX_SUGGESTIONS)
        .map(({ disciplina }) => disciplina);
}

document.addEventListener('DOMContentLoaded', () => {
    const rowsContainer = document.getElementById('rows-container');
    const addRowBtn = document.getElementById('add-row');
    const anoAtual = new Date().getFullYear();

    function salvarEstado() {
        const rows = rowsContainer.querySelectorAll('.row');

        const disciplinas = [];

        rows.forEach((row) => {
            disciplinas.push({
                codigo: row.querySelector('.input-codigo')?.value || '',
                nome: row.querySelector('.input-nome')?.value || '',
                nota: row.querySelector('.input-nota')?.value || '',
                status: row.querySelector('.status')?.textContent || 'Pendente',
                periodo: row.querySelector('.input-periodo')?.value || ''
            });
        });

        sessionStorage.setItem(
            'historicoManualTemp',
            JSON.stringify(disciplinas)
        );
    }

    function showModal(title, text, isAlert = false) {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-modal');
            const btnYes = document.getElementById('modal-btn-yes');
            const btnNo = document.getElementById('modal-btn-no');
            const modalIconContainer = modal.querySelector('.modal-icon');

            document.getElementById('modal-title').textContent = title;

            const modalTextEl = document.getElementById('modal-text');

            if (text.includes('<')) {
                modalTextEl.innerHTML = text;
            } else {
                modalTextEl.textContent = text;
            }

            modal.style.display = 'flex';

            if (isAlert) {
                btnNo.style.display = 'none';
                btnYes.textContent = 'Ok';
                modalIconContainer.innerHTML =
                    '<i class="fa-solid fa-circle-check"></i>';
                modalIconContainer.style.color = '#10b981';
            } else {
                btnNo.style.display = 'block';
                btnNo.textContent = 'Não';
                btnYes.textContent = 'Sim';
                modalIconContainer.innerHTML =
                    '<i class="fa-solid fa-circle-question"></i>';
                modalIconContainer.style.color = 'var(--accent-blue)';
            }

            btnYes.onclick = () => {
                modal.style.display = 'none';
                resolve(true);
            };

            btnNo.onclick = () => {
                modal.style.display = 'none';
                resolve(false);
            };
        });
    }

    async function verificarDuplicada(inputAtual, codigoDigitado) {
        const rows = rowsContainer.querySelectorAll('.row');

        let linhaDuplicada = null;

        rows.forEach((row) => {
            const inputCodigo = row.querySelector('.input-codigo');

            if (
                inputCodigo &&
                inputCodigo !== inputAtual &&
                inputCodigo.value.trim().toUpperCase() ===
                codigoDigitado.toUpperCase()
            ) {
                linhaDuplicada = row;
            }
        });

        if (linhaDuplicada) {
            const inputNomeDuplicado =
                linhaDuplicada.querySelector('.input-nome');

            const nomeMateria = inputNomeDuplicado
                ? inputNomeDuplicado.value
                : 'esta disciplina';

            const substituir = await showModal(
                'Disciplina Duplicada',
                `A disciplina <b>${nomeMateria} (${codigoDigitado.toUpperCase()})</b> já foi adicionada.<br>Deseja remover a entrada anterior e manter apenas esta?`,
                false
            );

            if (substituir) {
                linhaDuplicada.style.transition = 'all 0.2s ease';
                linhaDuplicada.style.opacity = '0';
                linhaDuplicada.style.transform = 'translateX(20px)';

                setTimeout(() => {
                    linhaDuplicada.remove();
                    salvarEstado();
                }, 200);

                await showModal(
                    'Sucesso',
                    'A entrada anterior foi substituída!',
                    true
                );
            } else {
                inputAtual.value = '';

                const rowAtual = inputAtual.closest('.row');

                if (rowAtual) {
                    rowAtual.dataset.selectedCodigo = '';

                    const inputNomeAtual =
                        rowAtual.querySelector('.input-nome');

                    if (inputNomeAtual) {
                        inputNomeAtual.value = '';
                        inputNomeAtual.classList.remove('filled-auto');
                    }
                }

                inputAtual.focus();

                salvarEstado();
            }
        }
    }

    function createRow() {
        const row = document.createElement('div');

        row.className = 'row';

        row.innerHTML = `
            <div class="discipline-search">
                <input
                    type="text"
                    placeholder="Código ou nome"
                    class="input-codigo"
                    autocomplete="off"
                    aria-label="Buscar disciplina por código ou nome"
                >

                <div class="search-dropdown" hidden></div>
            </div>

            <input
                type="text"
                placeholder="Nome da Disciplina"
                class="input-nome"
                readonly
            >

            <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="0.0"
                class="input-nota"
            >

            <div class="status">Pendente</div>

            <input
                type="text"
                placeholder="202X.X"
                class="input-periodo"
                maxlength="6"
            >

            <button class="btn-delete" title="Remover">
                <i class="fa-regular fa-trash-can"></i>
            </button>
        `;

        rowsContainer.appendChild(row);

        setupRowEvents(row);

        return row;
    }

    function setupRowEvents(row) {
        const inputCodigo = row.querySelector('.input-codigo');
        const inputNome = row.querySelector('.input-nome');
        const inputNota = row.querySelector('.input-nota');
        const inputPeriodo = row.querySelector('.input-periodo');
        const statusDiv = row.querySelector('.status');
        const btnDelete = row.querySelector('.btn-delete');
        const searchWrapper = row.querySelector('.discipline-search');
        const searchDropdown = row.querySelector('.search-dropdown');

        const searchState = {
            matches: [],
            activeIndex: -1
        };

        function limparDisciplinaSelecionada() {
            row.dataset.selectedCodigo = '';
            inputNome.value = '';
            inputNome.classList.remove('filled-auto');
        }

        function fecharDropdown() {
            searchDropdown.hidden = true;
            searchDropdown.innerHTML = '';
            searchState.matches = [];
            searchState.activeIndex = -1;
        }

        function destacarOpcaoAtiva() {
            const options =
                searchDropdown.querySelectorAll('.search-option');

            options.forEach((option, index) => {
                option.classList.toggle(
                    'is-active',
                    index === searchState.activeIndex
                );
            });
        }

        async function selecionarDisciplina(disciplina) {
            row.dataset.selectedCodigo = disciplina.codigo;

            inputCodigo.value = disciplina.codigo;
            inputNome.value = disciplina.nome;

            inputNome.classList.add('filled-auto');

            fecharDropdown();

            await verificarDuplicada(inputCodigo, disciplina.codigo);

            salvarEstado();
        }

        function renderizarDropdown(searchTerm) {
            if (erroAoCarregarDisciplinas) {
                searchDropdown.hidden = false;

                searchDropdown.innerHTML = `
                    <div class="search-empty">
                        ${escapeHtml(erroAoCarregarDisciplinas)}
                    </div>
                `;

                return;
            }

            if (carregandoDisciplinas) {
                searchDropdown.hidden = false;

                searchDropdown.innerHTML = `
                    <div class="search-empty">
                        Carregando disciplinas...
                    </div>
                `;

                return;
            }

            const matches = buscarDisciplinas(searchTerm);

            searchState.matches = matches;
            searchState.activeIndex = -1;

            if (matches.length === 0) {
                searchDropdown.hidden = false;

                searchDropdown.innerHTML = `
                    <div class="search-empty">
                        Nenhuma disciplina encontrada para esta busca.
                    </div>
                `;

                return;
            }

            searchDropdown.hidden = false;

            searchDropdown.innerHTML = matches
                .map(
                    (disciplina, index) => `
                <button
                    type="button"
                    class="search-option"
                    data-index="${index}"
                >
                    <span class="search-option-code">
                        ${escapeHtml(disciplina.codigo)}
                    </span>

                    <span class="search-option-name">
                        ${escapeHtml(disciplina.nome)}
                    </span>
                </button>
            `
                )
                .join('');
        }

        inputCodigo.addEventListener('focus', () => {
            renderizarDropdown(inputCodigo.value);
        });

        inputCodigo.addEventListener('input', async (e) => {
            const searchTerm = e.target.value;

            const exactMatch = encontrarDisciplinaExata(searchTerm);

            if (exactMatch) {
                await selecionarDisciplina(exactMatch);
                return;
            }

            limparDisciplinaSelecionada();

            renderizarDropdown(searchTerm);

            salvarEstado();
        });

        inputCodigo.addEventListener('keydown', async (e) => {
            if (
                searchDropdown.hidden ||
                searchState.matches.length === 0
            ) {
                if (e.key === 'ArrowDown') {
                    renderizarDropdown(inputCodigo.value);
                    e.preventDefault();
                }

                return;
            }

            if (e.key === 'ArrowDown') {
                searchState.activeIndex =
                    (searchState.activeIndex + 1) %
                    searchState.matches.length;

                destacarOpcaoAtiva();

                e.preventDefault();
            }

            if (e.key === 'ArrowUp') {
                searchState.activeIndex =
                    searchState.activeIndex <= 0
                        ? searchState.matches.length - 1
                        : searchState.activeIndex - 1;

                destacarOpcaoAtiva();

                e.preventDefault();
            }

            if (
                e.key === 'Enter' &&
                searchState.activeIndex >= 0
            ) {
                await selecionarDisciplina(
                    searchState.matches[searchState.activeIndex]
                );

                e.preventDefault();
            }

            if (e.key === 'Escape') {
                fecharDropdown();
            }
        });

        searchDropdown.addEventListener('mousedown', async (e) => {
            const option = e.target.closest('.search-option');

            if (!option) return;

            const { index } = option.dataset;

            const disciplina = searchState.matches[Number(index)];

            if (disciplina) {
                await selecionarDisciplina(disciplina);
            }

            e.preventDefault();
        });

        searchWrapper.addEventListener('focusout', () => {
            window.setTimeout(() => {
                if (!searchWrapper.contains(document.activeElement)) {
                    fecharDropdown();
                }
            }, 100);
        });

        inputNota.addEventListener('keydown', (e) => {
            if (['e', 'E', '+', '-'].includes(e.key)) {
                e.preventDefault();
            }
        });

        inputNota.addEventListener('input', () => {
            let valor = parseFloat(inputNota.value);

            if (valor > 10) {
                inputNota.value = 10;
            }

            if (valor < 0) {
                inputNota.value = 0;
            }

            salvarEstado();
        });

        inputNota.addEventListener('change', async (e) => {
            const nota = parseFloat(e.target.value);

            statusDiv.classList.remove(
                'aprovado',
                'reprovado'
            );

            if (nota >= 7) {
                statusDiv.textContent = 'Aprovado';
                statusDiv.classList.add('aprovado');
            } else if (nota >= 5 && nota < 7) {
                currentRowToUpdate = statusDiv;

                const aprovado = await showModal(
                    'Verificação de Status',
                    `A nota <b>${nota}</b> exige confirmação manual.<br>O aluno obteve aprovação?`,
                    false
                );

                if (aprovado) {
                    statusDiv.textContent = 'Aprovado';
                    statusDiv.classList.add('aprovado');
                } else {
                    statusDiv.textContent = 'Reprovado';
                    statusDiv.classList.add('reprovado');
                }
            } else if (nota < 5 && nota >= 0) {
                statusDiv.textContent = 'Reprovado';
                statusDiv.classList.add('reprovado');
            }

            salvarEstado();
        });

        btnDelete.addEventListener('click', async () => {
            const nomeMateria = inputNome.value || 'esta linha';

            const confirmarExclusao = await showModal(
                'Confirmar Exclusão',
                `Tem certeza que deseja remover ${nomeMateria}?`,
                false
            );

            if (confirmarExclusao) {
                row.style.transition = 'all 0.2s ease';
                row.style.opacity = '0';
                row.style.transform = 'translateX(20px)';

                setTimeout(() => {
                    row.remove();
                    salvarEstado();
                }, 200);

                await showModal(
                    'Sucesso',
                    'Registro removido com sucesso!',
                    true
                );
            }
        });

        inputPeriodo.addEventListener('input', () => {
            let valor = inputPeriodo.value
                .replace(/[^\d.]/g, '')
                .slice(0, 6);

            const partes = valor.split('.');

            let ano = partes[0] || '';
            let semestre = partes[1] || '';

            const anoMinimo = 1920;

            if (ano.length === 4) {
                const anoNumero = parseInt(ano);

                if (anoNumero > anoAtual) {
                    ano = String(anoAtual);
                }

                if (anoNumero < anoMinimo) {
                    ano = String(anoMinimo);
                }
            }

            if (semestre.length > 1) {
                semestre = semestre.slice(0, 1);
            }

            if (semestre && semestre !== '1' && semestre !== '2') {
                semestre = '';
            }

            inputPeriodo.value = semestre
                ? `${ano}.${semestre}`
                : ano;

            salvarEstado();
        });
    }

    const historicoSalvo =
        sessionStorage.getItem('historicoManualTemp');

    if (historicoSalvo) {
        const disciplinas = JSON.parse(historicoSalvo);

        disciplinas.forEach((disciplina) => {
            const row = createRow();

            row.querySelector('.input-codigo').value =
                disciplina.codigo;

            row.querySelector('.input-nome').value =
                disciplina.nome;

            row.querySelector('.input-nota').value =
                disciplina.nota;

            row.querySelector('.status').textContent =
                disciplina.status;

            row.querySelector('.input-periodo').value =
                disciplina.periodo;

            if (disciplina.nome) {
                row.querySelector('.input-nome')
                    .classList.add('filled-auto');
            }

            if (disciplina.status === 'Aprovado') {
                row.querySelector('.status')
                    .classList.add('aprovado');
            }

            if (disciplina.status === 'Reprovado') {
                row.querySelector('.status')
                    .classList.add('reprovado');
            }
        });
    } else {
        createRow();
    }

    addRowBtn.addEventListener('click', createRow);

    atualizarFeedbackDisciplinas(
        'Carregando disciplinas do banco...',
        'idle'
    );

    carregarDisciplinas()
        .then(() => {
            carregandoDisciplinas = false;

            atualizarFeedbackDisciplinas(
                `${disciplinasDisponiveis.length} disciplinas disponíveis para busca.`,
                'success'
            );
        })
        .catch((error) => {
            carregandoDisciplinas = false;

            erroAoCarregarDisciplinas =
                `Não foi possível carregar as disciplinas da API. Verifique se o servidor está em execução. (${error.message})`;

            atualizarFeedbackDisciplinas(
                erroAoCarregarDisciplinas,
                'error'
            );
        });

    const btnContinue = document.querySelector('.btn-continue');

    if (btnContinue) {
        btnContinue.addEventListener('click', async (e) => {
            e.preventDefault();

            const rows = rowsContainer.querySelectorAll('.row');

            const disciplinas = [];

            rows.forEach((row) => {
                const codigo =
                    row.querySelector('.input-codigo').value;

                const nome =
                    row.querySelector('.input-nome').value;

                const nota =
                    row.querySelector('.input-nota').value;

                const status =
                    row.querySelector('.status').textContent;

                const periodo =
                    row.querySelector('.input-periodo').value;

                if (codigo && nome) {
                    disciplinas.push({
                        codigo,
                        nome,
                        nota: nota ? parseFloat(nota) : 0,
                        status,
                        periodo
                    });
                }
            });

            if (disciplinas.length === 0) {
                alert(
                    'Por favor, adicione pelo menos uma disciplina antes de continuar.'
                );

                return;
            }

            sessionStorage.setItem(
                'historicoManual',
                JSON.stringify({ disciplinas })
            );

            sessionStorage.setItem(
                'historicoManualTemp',
                JSON.stringify(disciplinas)
            );

            sessionStorage.setItem('currentStep', 2);

            await showModal(
                'Sucesso',
                'Histórico manual salvo com sucesso!',
                true
            );

            window.location.href =
                'tela_revisao_historico.html';
        });
    }
});
