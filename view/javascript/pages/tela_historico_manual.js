
/**
 * Tela de preenchimento manual do histórico.
 *
 * Fluxo principal:
 * 1. Carrega as disciplinas disponíveis via API.
 * 2. Permite buscar por código ou nome com sugestões.
 * 3. Calcula o status da disciplina com base na nota.
 * 4. Persiste o histórico montado em sessionStorage antes de avançar.
 */
const API_URL = `${API_BASE_URL}/api/disciplinas/`;
const MAX_SUGGESTIONS = 8;

let currentRowToUpdate = null;
let disciplinasDisponiveis = [];
let carregandoDisciplinas = true;
let erroAoCarregarDisciplinas = null;

/** Escapa texto antes de inserir conteúdo dinâmico no dropdown. */
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Remove acentos e normaliza caixa para buscas mais tolerantes. */
function normalizeText(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

/** Ordena por código preservando comparação numérica amigável ao pt-BR. */
function ordenarDisciplinas(a, b) {
    return a.codigo.localeCompare(b.codigo, 'pt-BR', { numeric: true, sensitivity: 'base' });
}

/** Atualiza a mensagem de feedback logo abaixo do cabeçalho da tela. */
function atualizarFeedbackDisciplinas(message, status = 'idle') {
    const feedback = document.getElementById('disciplinas-feedback');
    if (!feedback) {
        return;
    }

    feedback.textContent = message;
    feedback.className = 'disciplinas-feedback';

    if (status === 'error') {
        feedback.classList.add('is-error');
    }

    if (status === 'success') {
        feedback.classList.add('is-success');
    }
}

/** Busca as disciplinas na API e mantém a lista local já ordenada. */
async function carregarDisciplinas() {
    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const disciplinas = await response.json();
    disciplinasDisponiveis = disciplinas.sort(ordenarDisciplinas);
}

/** Retorna uma disciplina somente quando o termo bate exatamente com código ou nome. */
function encontrarDisciplinaExata(searchTerm) {
    const normalizedTerm = normalizeText(searchTerm);

    if (!normalizedTerm) {
        return null;
    }

    return disciplinasDisponiveis.find((disciplina) => {
        const codigoNormalizado = normalizeText(disciplina.codigo);
        const nomeNormalizado = normalizeText(disciplina.nome);
        return codigoNormalizado === normalizedTerm || nomeNormalizado === normalizedTerm;
    }) ?? null;
}

/**
 * Ranqueia sugestões por proximidade com o termo informado.
 * Prioridade: início do código, início do nome, trecho do código, trecho do nome.
 */
function buscarDisciplinas(searchTerm) {
    if (carregandoDisciplinas) {
        return [];
    }

    const normalizedTerm = normalizeText(searchTerm);

    if (!normalizedTerm) {
        return disciplinasDisponiveis.slice(0, MAX_SUGGESTIONS);
    }

    return disciplinasDisponiveis
        .map((disciplina) => {
            const codigoNormalizado = normalizeText(disciplina.codigo);
            const nomeNormalizado = normalizeText(disciplina.nome);
            let score = Number.POSITIVE_INFINITY;

            if (codigoNormalizado.startsWith(normalizedTerm)) {
                score = 0;
            } else if (nomeNormalizado.startsWith(normalizedTerm)) {
                score = 1;
            } else if (codigoNormalizado.includes(normalizedTerm)) {
                score = 2;
            } else if (nomeNormalizado.includes(normalizedTerm)) {
                score = 3;
            }

            return { disciplina, score };
        })
        .filter(({ score }) => Number.isFinite(score))
        .sort((a, b) => a.score - b.score || ordenarDisciplinas(a.disciplina, b.disciplina))
        .slice(0, MAX_SUGGESTIONS)
        .map(({ disciplina }) => disciplina);
}

document.addEventListener('DOMContentLoaded', () => {
    const rowsContainer = document.getElementById('rows-container');
    const addRowBtn = document.getElementById('add-row');

    /** Cria uma nova linha vazia do histórico e conecta seus eventos. */
    function createRow() {
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = `
            <div class="discipline-search">
                <input type="text" placeholder="Código ou nome" class="input-codigo" autocomplete="off" aria-label="Buscar disciplina por código ou nome">
                <div class="search-dropdown" hidden></div>
            </div>
            <input type="text" placeholder="Nome da Disciplina" class="input-nome" readonly>
            <input type="number" step="0.1" placeholder="0.0" class="input-nota">
            <div class="status">Pendente</div>
            <input type="text" placeholder="202X.X" class="input-periodo">
            <button class="btn-delete" title="Remover"><i class="fa-regular fa-trash-can"></i></button>
        `;
        
        rowsContainer.appendChild(row);
        setupRowEvents(row);
    }

    /** Encapsula toda a lógica interativa de uma linha da tabela manual. */
    function setupRowEvents(row) {
        const inputCodigo = row.querySelector('.input-codigo');
        const inputNome = row.querySelector('.input-nome');
        const inputNota = row.querySelector('.input-nota');
        const inputPeriodo = row.querySelector('.input-periodo');
        const statusDiv = row.querySelector('.status');
        const btnDelete = row.querySelector('.btn-delete');
        const searchWrapper = row.querySelector('.discipline-search');
        const searchDropdown = row.querySelector('.search-dropdown');
        const searchState = { matches: [], activeIndex: -1 };

        /** Limpa a disciplina vinculada quando o usuário volta a digitar. */
        function limparDisciplinaSelecionada() {
            row.dataset.selectedCodigo = '';
            inputNome.value = '';
            inputNome.classList.remove('filled-auto');
        }

        /** Fecha e reseta o estado visual do dropdown de sugestões. */
        function fecharDropdown() {
            searchDropdown.hidden = true;
            searchDropdown.innerHTML = '';
            searchState.matches = [];
            searchState.activeIndex = -1;
        }

        /** Marca visualmente a opção ativa ao navegar com o teclado. */
        function destacarOpcaoAtiva() {
            const options = searchDropdown.querySelectorAll('.search-option');
            options.forEach((option, index) => {
                option.classList.toggle('is-active', index === searchState.activeIndex);
            });
        }

        /** Sincroniza o código escolhido com o nome preenchido automaticamente. */
        function selecionarDisciplina(disciplina) {
            row.dataset.selectedCodigo = disciplina.codigo;
            inputCodigo.value = disciplina.codigo;
            inputNome.value = disciplina.nome;
            inputNome.classList.add('filled-auto');
            fecharDropdown();
        }

        /** Renderiza sugestões ou estados de erro/carregamento para a busca atual. */
        function renderizarDropdown(searchTerm) {
            if (erroAoCarregarDisciplinas) {
                searchDropdown.hidden = false;
                searchDropdown.innerHTML = `<div class="search-empty">${escapeHtml(erroAoCarregarDisciplinas)}</div>`;
                return;
            }

            if (carregandoDisciplinas) {
                searchDropdown.hidden = false;
                searchDropdown.innerHTML = '<div class="search-empty">Carregando disciplinas...</div>';
                return;
            }

            const matches = buscarDisciplinas(searchTerm);
            searchState.matches = matches;
            searchState.activeIndex = -1;

            if (matches.length === 0) {
                searchDropdown.hidden = false;
                searchDropdown.innerHTML = '<div class="search-empty">Nenhuma disciplina encontrada para esta busca.</div>';
                return;
            }

            searchDropdown.hidden = false;
            searchDropdown.innerHTML = matches.map((disciplina, index) => `
                <button type="button" class="search-option" data-index="${index}">
                    <span class="search-option-code">${escapeHtml(disciplina.codigo)}</span>
                    <span class="search-option-name">${escapeHtml(disciplina.nome)}</span>
                </button>
            `).join('');
        }

        inputCodigo.addEventListener('focus', () => {
            renderizarDropdown(inputCodigo.value);
        });

        // Se houver correspondência exata, a seleção é aplicada imediatamente.
        inputCodigo.addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            const exactMatch = encontrarDisciplinaExata(searchTerm);

            if (exactMatch) {
                selecionarDisciplina(exactMatch);
                return;
            }

            limparDisciplinaSelecionada();
            renderizarDropdown(searchTerm);
        });

        // Permite navegar nas sugestões sem tirar as mãos do teclado.
        inputCodigo.addEventListener('keydown', (e) => {
            if (searchDropdown.hidden || searchState.matches.length === 0) {
                if (e.key === 'ArrowDown') {
                    renderizarDropdown(inputCodigo.value);
                    e.preventDefault();
                }
                return;
            }

            if (e.key === 'ArrowDown') {
                searchState.activeIndex = (searchState.activeIndex + 1) % searchState.matches.length;
                destacarOpcaoAtiva();
                e.preventDefault();
            }

            if (e.key === 'ArrowUp') {
                searchState.activeIndex = searchState.activeIndex <= 0
                    ? searchState.matches.length - 1
                    : searchState.activeIndex - 1;
                destacarOpcaoAtiva();
                e.preventDefault();
            }

            if (e.key === 'Enter' && searchState.activeIndex >= 0) {
                selecionarDisciplina(searchState.matches[searchState.activeIndex]);
                e.preventDefault();
            }

            if (e.key === 'Escape') {
                fecharDropdown();
            }
        });

        // mousedown evita perder o foco antes de processar a seleção clicada.
        searchDropdown.addEventListener('mousedown', (e) => {
            const option = e.target.closest('.search-option');
            if (!option) {
                return;
            }

            const { index } = option.dataset;
            const disciplina = searchState.matches[Number(index)];
            if (disciplina) {
                selecionarDisciplina(disciplina);
            }
            e.preventDefault();
        });

        // Fecha a lista apenas quando o foco realmente sai da área de busca.
        searchWrapper.addEventListener('focusout', () => {
            window.setTimeout(() => {
                if (!searchWrapper.contains(document.activeElement)) {
                    fecharDropdown();
                }
            }, 100);
        });

        // Lógica de Notas
        inputNota.addEventListener('change', (e) => {
            const nota = parseFloat(e.target.value);
            statusDiv.classList.remove('aprovado', 'reprovado');

            if (nota >= 7) {
                statusDiv.textContent = 'Aprovado';
                statusDiv.classList.add('aprovado');
            } else if (nota >= 5 && nota < 7) {
                currentRowToUpdate = statusDiv;
                document.getElementById('modal-text').innerHTML = `A nota <b>${nota}</b> exige confirmação manual.<br>Você obteve aprovação?`;
                document.getElementById('confirm-modal').style.display = 'flex';
            } else if (nota < 5 && nota >= 0) {
                statusDiv.textContent = 'Reprovado';
                statusDiv.classList.add('reprovado');
            }
        });

        btnDelete.addEventListener('click', () => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(20px)';
            setTimeout(() => row.remove(), 200);
        });

        // Mantém o período no formato livre 202X.X sem aceitar outros caracteres.
        inputPeriodo.addEventListener('input', () => {
            inputPeriodo.value = inputPeriodo.value.replace(/[^\d.]/g, '').slice(0, 6);
        });
    }

    // Modal Control
    const closeModal = () => document.getElementById('confirm-modal').style.display = 'none';

    document.getElementById('modal-confirm').onclick = () => {
        if (currentRowToUpdate) {
            currentRowToUpdate.textContent = 'Aprovado';
            currentRowToUpdate.classList.add('aprovado');
        }
        closeModal();
    };

    document.getElementById('modal-cancel').onclick = () => {
        if (currentRowToUpdate) {
            currentRowToUpdate.textContent = 'Reprovado';
            currentRowToUpdate.classList.add('reprovado');
        }
        closeModal();
    };

    addRowBtn.addEventListener('click', createRow);

    // A primeira linha só é criada após resolver o carregamento inicial da API.
    atualizarFeedbackDisciplinas('Carregando disciplinas do banco...', 'idle');

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
            erroAoCarregarDisciplinas = `Não foi possível carregar as disciplinas da API. Verifique se o servidor está em execução. (${error.message})`;
            atualizarFeedbackDisciplinas(erroAoCarregarDisciplinas, 'error');
        })
        .finally(() => {
            createRow();
        });

    // Evento para botão Continuar
    const btnContinue = document.querySelector('.btn-continue');
    if (btnContinue) {
        btnContinue.addEventListener('click', (e) => {
            e.preventDefault();

            // Coleta apenas linhas preenchidas o suficiente para virar histórico.
            const rows = rowsContainer.querySelectorAll('.row');
            const disciplinas = [];

            rows.forEach(row => {
                const codigo = row.querySelector('.input-codigo').value;
                const nome = row.querySelector('.input-nome').value;
                const nota = row.querySelector('.input-nota').value;
                const status = row.querySelector('.status').textContent;
                const periodo = row.querySelector('.input-periodo').value;

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
                alert('Por favor, adicione pelo menos uma disciplina antes de continuar.');
                return;
            }

            // Persiste os dados no navegador para a tela de revisão consumir.
            sessionStorage.setItem('historicoManual', JSON.stringify({ disciplinas }));

            // Avança o fluxo guiado para a etapa seguinte.
            sessionStorage.setItem('currentStep', 2);
            window.location.href = 'tela_revisao_historico.html';
        });
    }
});