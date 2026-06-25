/**
 * Tela de preenchimento manual do histórico.
 *
 * Fluxo principal:
 * 1. Carrega as disciplinas disponíveis via BANCO (PostgreSQL).
 * 2. Permite buscar por código ou nome com sugestões flutuantes.
 * 3. Calcula o status da disciplina de forma reativa com base na nota.
 * 4. Persiste o histórico em sessionStorage integrado para a tela de revisão.
 */

// Garante resiliência caso a constante global api_config não tenha carregado a tempo
const BASE_URL = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://127.0.0.1:8000';
const API_URL = `${BASE_URL}/api/disciplinas/`;
const MAX_SUGGESTIONS = 8;

let currentRowToUpdate = null;
let disciplinasDisponiveis = [];
let carregandoDisciplinas = true;
let erroAoCarregarDisciplinas = null;

/** Escapa texto antes de inserir conteúdo dinâmico no dropdown (Proteção XSS). */
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
    if (!feedback) return;

    feedback.textContent = message;
    feedback.className = 'disciplinas-feedback';

    if (status === 'error') feedback.classList.add('is-error');
    if (status === 'success') feedback.classList.add('is-success');
}

/** Busca as disciplinas na API do seu banco de dados. */
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

/** Ranqueia sugestões por proximidade com o termo informado (Busca Inteligente). */
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

    /** Cria uma nova linha vazia respeitando estritamente o seu HTML/CSS */
    function createRow() {
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = `
            <div class="discipline-search">
                <input type="text" placeholder="Código ou nome" class="input-codigo" autocomplete="off" aria-label="Buscar disciplina por código ou nome">
                <div class="search-dropdown" hidden></div>
            </div>
            <input type="text" placeholder="Nome da Disciplina" class="input-nome" readonly>
            <input type="number" step="0.1" placeholder="0.0" class="input-nota" min="0" max="10">
            <div class="status">Pendente</div>
            <input type="text" placeholder="202X.X" class="input-periodo">
            <button class="btn-delete" title="Remover"><i class="fa-regular fa-trash-can"></i></button>
        `;
        
        rowsContainer.appendChild(row);
        setupRowEvents(row);
    }

    /** Encapsula toda a lógica interativa e eventos de cada linha */
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
            const options = searchDropdown.querySelectorAll('.search-option');
            options.forEach((option, index) => {
                option.classList.toggle('is-active', index === searchState.activeIndex);
            });
        }

        function selecionarDisciplina(disciplina) {
            row.dataset.selectedCodigo = disciplina.codigo;
            inputCodigo.value = disciplina.codigo;
            inputNome.value = disciplina.nome;
            inputNome.classList.add('filled-auto');
            fecharDropdown();
            atualizarStatusReal(inputNota.value, statusDiv);
        }

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
                searchDropdown.innerHTML = '<div class="search-empty">Nenhuma disciplina encontrada.</div>';
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

        function atualizarStatusReal(notaStr, targetStatusDiv) {
            const valStr = notaStr.trim();
            targetStatusDiv.className = 'status'; // Limpa classes de cor antigas

            if (valStr === '') {
                targetStatusDiv.textContent = 'Pendente';
                return;
            }

            const nota = parseFloat(valStr.replace(',', '.'));
            if (isNaN(nota)) return;

            if (nota >= 7) {
                targetStatusDiv.textContent = 'Aprovado';
                targetStatusDiv.classList.add('aprovado');
            } else if (nota >= 5 && nota < 7) {
                currentRowToUpdate = targetStatusDiv;
                document.getElementById('modal-text').innerHTML = `A nota <b>${nota.toFixed(1)}</b> exige confirmação manual.<br>Você obteve aprovação?`;
                document.getElementById('confirm-modal').style.display = 'flex';
            } else if (nota < 5 && nota >= 0) {
                targetStatusDiv.textContent = 'Reprovado';
                targetStatusDiv.classList.add('reprovado');
            }
        }

        inputCodigo.addEventListener('focus', () => {
            renderizarDropdown(inputCodigo.value);
        });

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

        searchDropdown.addEventListener('mousedown', (e) => {
            const option = e.target.closest('.search-option');
            if (!option) return;

            const { index } = option.dataset;
            const disciplina = searchState.matches[Number(index)];
            if (disciplina) {
                selecionarDisciplina(disciplina);
            }
            e.preventDefault();
        });

        searchWrapper.addEventListener('focusout', () => {
            window.setTimeout(() => {
                if (!searchWrapper.contains(document.activeElement)) {
                    fecharDropdown();
                }
            }, 120);
        });

        // Evento reativo de digitação de nota
    inputNota.addEventListener('blur', (e) => {
        atualizarStatusReal(e.target.value, statusDiv);
    });
        // Animação e exclusão da linha
        btnDelete.addEventListener('click', () => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(20px)';
            setTimeout(() => row.remove(), 200);
        });

        // Formatação sutil do período
        inputPeriodo.addEventListener('input', () => {
            inputPeriodo.value = inputPeriodo.value.replace(/[^\d.]/g, '').slice(0, 6);
        });
    }

    // Controle central do Modal do seu HTML
    const closeModal = () => document.getElementById('confirm-modal').style.display = 'none';

    document.getElementById('modal-confirm').onclick = () => {
        if (currentRowToUpdate) {
            currentRowToUpdate.className = 'status aprovado';
            currentRowToUpdate.textContent = 'Aprovado';
        }
        closeModal();
    };

    document.getElementById('modal-cancel').onclick = () => {
        if (currentRowToUpdate) {
            currentRowToUpdate.className = 'status reprovado';
            currentRowToUpdate.textContent = 'Reprovado';
        }
        closeModal();
    };

    addRowBtn.addEventListener('click', createRow);

    // Inicialização do feedback visual
    atualizarFeedbackDisciplinas('Conectando ao banco de dados...', 'idle');

    carregarDisciplinas()
        .then(() => {
            carregandoDisciplinas = false;
            atualizarFeedbackDisciplinas(
                `✓ Sincronizado: ${disciplinasDisponiveis.length} disciplinas carregadas do banco de dados.`,
                'success'
            );
        })
        .catch((error) => {
            carregandoDisciplinas = false;
            erroAoCarregarDisciplinas = `Erro de conexão com o banco de dados (${error.message}).`;
            atualizarFeedbackDisciplinas(erroAoCarregarDisciplinas, 'error');
        })
        .finally(() => {
            createRow(); // Cria a primeira linha em branco regulada pelo banco
        });

    // ========================================================
    // Integração de Chaves de Envio entre as Telas
    // ========================================================
    const btnContinue = document.querySelector('.btn-continue');
    if (btnContinue) {
        btnContinue.addEventListener('click', (e) => {
            e.preventDefault();

            const rows = rowsContainer.querySelectorAll('.row');
            const disciplinas = [];

            rows.forEach(row => {
                const inputCodElement = row.querySelector('.input-codigo');
                const codigo = inputCodElement ? inputCodElement.value.toUpperCase().trim() : '';
                
                const inputNomeElement = row.querySelector('.input-nome');
                const nome = inputNomeElement ? inputNomeElement.value.trim() : '';
                
                const inputNotaElement = row.querySelector('.input-nota');
                const notaRaw = inputNotaElement ? inputNotaElement.value : '';
                
                const statusElement = row.querySelector('.status');
                const status = statusElement ? statusElement.textContent.toUpperCase().trim() : '';
                
                const inputPerElement = row.querySelector('.input-periodo');
                const periodo = inputPerElement ? inputPerElement.value.trim() : '';

                if (codigo && nome) {
                    disciplinas.push({
                        codigo_disciplina: codigo,       
                        nome_disciplina: nome,           
                        media: notaRaw ? parseFloat(notaRaw) : '—',
                        situacao: status === 'PENDENTE' ? 'CURSANDO' : status, 
                        ano_periodo_letivo: periodo || '—'
                    });
                }
            });

            if (disciplinas.length === 0) {
                alert('Adicione e selecione ao menos uma disciplina válida do banco para prosseguir.');
                return;
            }

            const payload = JSON.stringify({ disciplinas });
            sessionStorage.setItem('historicoManual', payload);
            sessionStorage.setItem('historicoExtraido', payload); 

            sessionStorage.setItem('currentStep', 2);
            window.location.href = 'tela_revisao_historico.html';
        });
    }
});