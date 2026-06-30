/**
 * Gerencia a revisão manual do histórico antes da recomendação.
 * * Unificado com o sistema de busca inteligente por score e dropdown flutuante.
 */
document.addEventListener('DOMContentLoaded', () => {
    const rowsContainer = document.getElementById('rows-container');
    const alertBox = document.querySelector('.alert-box');
    const btnAddManual = document.querySelector('.btn-add-manual');
    const alertCatalogo = document.getElementById('alert-catalogo');
    const alertCatalogoTexto = document.getElementById('alert-catalogo-texto');
    
    const API_BASE = typeof API_BASE_URL === 'string' ? API_BASE_URL : '';
    const CATALOGO_API_URL = `${API_BASE}/api/recomendacoes/catalogo`;
    const MAX_SUGGESTIONS = 8;

    let codigosCatalogo = new Set();
    let nomesCatalogo = new Map();

    // ==========================================
    // UTILITÁRIOS DE TRATAMENTO DE TEXTO E BUSCA
    // ==========================================

    /** Escapa caracteres HTML para exibição segura */
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /** Remove acentos e padroniza a caixa do texto */
    function normalizeText(value) {
        return String(value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    /** Filtra e pontua as disciplinas de acordo com o termo buscado */
    function buscarDisciplinasLocal(searchTerm) {
        if (!nomesCatalogo.size) return [];
        const normalizedTerm = normalizeText(searchTerm);
        const listaParaBusca = Array.from(nomesCatalogo.entries()).map(([codigo, nome]) => ({ codigo, nome }));

        if (!normalizedTerm) {
            return listaParaBusca.slice(0, MAX_SUGGESTIONS);
        }

        return listaParaBusca
            .map((item) => {
                const codigoNormalizado = normalizeText(item.codigo);
                const nomeNormalizado = normalizeText(item.nome);
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

                return { item, score };
            })
            .filter(({ score }) => Number.isFinite(score))
            .sort((a, b) => a.score - b.score || a.item.codigo.localeCompare(b.item.codigo))
            .slice(0, MAX_SUGGESTIONS)
            .map(({ item }) => item);
    }

    // ==========================================
    // GERENCIAMENTO DO DROPDOWN INTELIGENTE
    // ==========================================

    /** Configura os eventos de teclado, foco e clique do dropdown de busca */
    function setupDropdownEventos(row) {
        const inputCod = row.querySelector('.edit-codigo');
        const inputNom = row.querySelector('.edit-nome');
        const searchWrapper = row.querySelector('.discipline-search-revisao');
        const searchDropdown = row.querySelector('.search-dropdown-revisao');
        const searchState = { matches: [], activeIndex: -1 };

        function fecharDropdown() {
            searchDropdown.hidden = true;
            searchDropdown.innerHTML = '';
            searchState.matches = [];
            searchState.activeIndex = -1;
        }

        function destacarOpcaoAtiva() {
            const options = searchDropdown.querySelectorAll('.search-option-revisao');
            options.forEach((option, index) => {
                option.classList.toggle('is-active', index === searchState.activeIndex);
            });
        }

        function selecionarDisciplina(item) {
            inputCod.value = item.codigo;
            inputNom.value = item.nome;
            inputCod.classList.remove('input-error');
            if (row.dataset.errorType === 'codigo_catalogo') {
                row.classList.remove('row-error');
                delete row.dataset.errorType;
            }
            fecharDropdown();
        }

        function renderizarDropdown(searchTerm) {
            const matches = buscarDisciplinasLocal(searchTerm);
            searchState.matches = matches;
            searchState.activeIndex = -1;

            if (matches.length === 0) {
                searchDropdown.hidden = false;
                searchDropdown.innerHTML = '<div class="search-empty-revisao">Nenhuma disciplina encontrada.</div>';
                return;
            }

            searchDropdown.hidden = false;
            searchDropdown.innerHTML = matches.map((item, index) => `
                <button type="button" class="search-option-revisao" data-index="${index}">
                    <span class="search-option-code-revisao">${escapeHtml(item.codigo)}</span>
                    <span class="search-option-name-revisao">${escapeHtml(item.nome)}</span>
                </button>
            `).join('');
        }

        inputCod.addEventListener('focus', () => renderizarDropdown(inputCod.value));
        
        inputCod.addEventListener('input', (e) => {
            const val = e.target.value.toUpperCase();
            if (nomesCatalogo.has(val)) {
                inputNom.value = nomesCatalogo.get(val);
                inputCod.classList.remove('input-error');
            } else {
                inputNom.value = '';
            }
            renderizarDropdown(e.target.value);
        });

        inputCod.addEventListener('keydown', (e) => {
            if (searchDropdown.hidden || searchState.matches.length === 0) return;

            if (e.key === 'ArrowDown') {
                searchState.activeIndex = (searchState.activeIndex + 1) % searchState.matches.length;
                destacarOpcaoAtiva();
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                searchState.activeIndex = searchState.activeIndex <= 0 ? searchState.matches.length - 1 : searchState.activeIndex - 1;
                destacarOpcaoAtiva();
                e.preventDefault();
            } else if (e.key === 'Enter' && searchState.activeIndex >= 0) {
                selecionarDisciplina(searchState.matches[searchState.activeIndex]);
                e.preventDefault();
            } else if (e.key === 'Escape') {
                fecharDropdown();
            }
        });

        searchDropdown.addEventListener('mousedown', (e) => {
            const option = e.target.closest('.search-option-revisao');
            if (option) {
                const index = Number(option.dataset.index);
                if (searchState.matches[index]) selecionarDisciplina(searchState.matches[index]);
            }
            e.preventDefault();
        });

        document.addEventListener('click', (e) => {
            if (searchWrapper && !searchWrapper.contains(e.target)) fecharDropdown();
        });
    }

    // ==========================================
    // CARREGAMENTO DE DADOS (API E STORAGE)
    // ==========================================

    carregarHistoricoDoSessionStorage();
    carregarCatalogoCodigos();

    async function carregarCatalogoCodigos() {
        try {
            const response = await fetch(CATALOGO_API_URL);
            if (!response.ok) throw new Error('Falha ao carregar catálogo.');
            const payload = await response.json();
            const lista = Array.isArray(payload.disciplinas) ? payload.disciplinas : [];
            
            codigosCatalogo = new Set(
                lista.map((d) => String(d?.codigo || '').toUpperCase().trim()).filter(Boolean)
            );
            nomesCatalogo = new Map(
                lista.map((d) => {
                    const codigo = String(d?.codigo || '').toUpperCase().trim();
                    const nome = String(d?.nome || '').trim();
                    return [codigo, nome || codigo];
                }).filter(([codigo]) => Boolean(codigo))
            );

            aplicarMarcacaoCatalogoNasLinhas();
            aplicarNomesCatalogoNasLinhas();
            atualizarAlertaCatalogo();
        } catch (_) {
            codigosCatalogo = new Set();
            nomesCatalogo = new Map();
            if (alertCatalogo && alertCatalogoTexto) {
                alertCatalogo.style.display = 'flex';
                alertCatalogoTexto.textContent = 'Não foi possível validar o catálogo de disciplinas no momento.';
            }
        }
    }

    function aplicarNomesCatalogoNasLinhas() {
        if (!nomesCatalogo.size) return;
        document.querySelectorAll('#rows-container .row').forEach((row) => {
            if (row.classList.contains('row-editing')) return;
            const spans = row.querySelectorAll('span');
            if (!spans || spans.length < 2) return;
            const codigo = (spans[0]?.textContent || '').trim().toUpperCase();
            if (!codigo || codigo === '—') return;
            const nomeOficial = nomesCatalogo.get(codigo);
            if (nomeOficial) spans[1].textContent = nomeOficial;
        });
    }

    function aplicarMarcacaoCatalogoNasLinhas() {
        if (!codigosCatalogo.size) return;
        document.querySelectorAll('#rows-container .row').forEach((row) => {
            if (row.classList.contains('row-editing')) return;
            const codigo = (row.querySelector('span')?.textContent || '').trim().toUpperCase();
            if (!codigo || codigo === '—') return;

            const isValido = codigosCatalogo.has(codigo);
            const erroAtual = row.dataset.errorType || '';

            if (!isValido && erroAtual !== 'nota') {
                row.classList.add('row-error');
                row.dataset.errorType = 'codigo_catalogo';

                const statusPill = row.querySelector('.status-pill');
                if (statusPill) {
                    statusPill.className = 'status-pill indefinido';
                    statusTxt = 'NÃO VALIDADO';
                }

                const actions = row.querySelector('.actions');
                if (actions) actions.outerHTML = '<button class="btn-fix">Corrigir</button>';
            }
        });
    }

    function listarCodigosTabela() {
        return Array.from(document.querySelectorAll('#rows-container .row'))
            .map((row) => (row.querySelector('span')?.textContent || '').trim().toUpperCase())
            .filter(Boolean);
    }

    function atualizarAlertaCatalogo() {
        if (!alertCatalogo || !alertCatalogoTexto || !codigosCatalogo.size) return;
        const codigosHistorico = listarCodigosTabela();
        const foraCatalogo = [...new Set(codigosHistorico.filter((codigo) => !codigosCatalogo.has(codigo)))].sort();

        if (!foraCatalogo.length) {
            alertCatalogo.style.display = 'none';
            return;
        }
        alertCatalogo.style.display = 'flex';
        alertCatalogoTexto.textContent = `Esses códigos não existem no catálogo atual e serão ignorados: ${foraCatalogo.join(', ')}`;
    }

    function carregarHistoricoDoSessionStorage() {
        rowsContainer.innerHTML = '';
        const dadosRaw = sessionStorage.getItem("historicoExtraido") || sessionStorage.getItem("historicoRevisado");
        
        if (!dadosRaw) {
            rowsContainer.innerHTML = `<div class="row revisao-grid"><span class="text-secondary">—</span><span class="bold">Nenhum histórico carregado</span><span class="text-secondary">—</span><span class="text-secondary">—</span><div class="status-pill indefinido">INDEFINIDO</div><div class="actions"></div></div>`;
            updateInterface();
            return;
        }

        try {
            let materias = JSON.parse(dadosRaw);
            if (materias && !Array.isArray(materias)) {
                if (Array.isArray(materias.disciplinas)) materias = materias.disciplinas;
                else if (Array.isArray(materias.materias)) materias = materias.materias;
            }

            const listaMaterias = Array.isArray(materias) ? materias : [materias];
            const extrairCampo = (obj, chaves) => {
                for (let c of chaves) { if (obj[c] !== undefined && obj[c] !== null) return obj[c]; }
                return undefined;
            };

            listaMaterias.forEach(materia => {
                if (!materia) return;
                const row = document.createElement('div');
                
                const codRaw = extrairCampo(materia, ['codigo_disciplina', 'codigo', 'código']);
                const codigo = codRaw ? String(codRaw).toUpperCase().trim() : "—";
                const nomeRaw = extrairCampo(materia, ['nome_disciplina', 'nome']);
                const nomeExibicao = nomeRaw || "Disciplina sem nome";
                const perRaw = extrairCampo(materia, ['ano_periodo_letivo', 'periodo', 'período']);
                const periodo = perRaw ? String(perRaw).trim() : "—";
                const situacaoRaw = extrairCampo(materia, ['situacao', 'situação', 'status', 'STATUS']);
                const situacaoApi = situacaoRaw ? String(situacaoRaw).toUpperCase().trim() : "";
                const mediaRaw = extrairCampo(materia, ['media', 'média', 'nota', 'NOTA']);
                let mediaStr = mediaRaw !== undefined && mediaRaw !== null ? String(mediaRaw).trim() : "-";

                let notaHtml = '';
                let statusClass = 'indefinido';
                let statusTxt = 'INDEFINIDO';
                let acoesHtml = '';

                const siglas = {
                    aprovado: ["APRM", "APR", "CUMP", "DISP", "TRANS", "INCORP"],
                    reprovado: ["REPMF", "REPF", "REP"],
                    cursando: ["MATR", "REC"]
                };

                if (siglas.aprovado.some(s => situacaoApi.includes(s))) {
                    statusClass = "aprovado"; statusTxt = "APROVADO";
                } else if (siglas.reprovado.some(s => situacaoApi.includes(s))) {
                    statusClass = "reprovado"; statusTxt = "REPROVADO";
                } else if (siglas.cursando.some(s => situacaoApi.includes(s))) {
                    statusClass = "cursando"; statusTxt = "MATRICULADO";
                } else if (mediaStr !== "-" && mediaStr !== "" && mediaStr.toUpperCase() !== "N/A") {
                    const nDeducao = parseFloat(mediaStr.replace(',', '.'));
                    if (!isNaN(nDeducao)) {
                        if (nDeducao >= 7.0) { statusClass = "aprovado"; statusTxt = "APROVADO"; }
                        else if (nDeducao < 5.0) { statusClass = "reprovado"; statusTxt = "REPROVADO"; }
                    }
                }

                if (statusTxt === "MATRICULADO" || (statusTxt === "APROVADO" && (mediaStr === "-" || mediaStr === ""))) {
                    notaHtml = `<span class="text-secondary">—</span>`;
                    acoesHtml = `<div class="actions"><button class="btn-icon"><i class="fa-regular fa-pen-to-square"></i></button><button class="btn-icon"><i class="fa-regular fa-trash-can"></i></button></div>`;
                } else if (mediaStr === "-" || mediaStr === "" || mediaStr.toUpperCase() === "N/A" || isNaN(parseFloat(mediaStr.replace(',','.')))) {
                    row.className = 'row revisao-grid row-error';
                    row.dataset.errorType = "nota";
                    statusClass = "indefinido"; statusTxt = "INDEFINIDO";
                    notaHtml = `<span class="bold error-text"><span class="dot"></span> N/A</span>`;
                    acoesHtml = `<button class="btn-fix">Corrigir</button>`;
                } else {
                    const nNum = parseFloat(mediaStr.replace(',', '.'));
                    notaHtml = `<span class="bold blue-text">${nNum.toFixed(1)}</span>`;
                    acoesHtml = `<div class="actions"><button class="btn-icon"><i class="fa-regular fa-pen-to-square"></i></button><button class="btn-icon"><i class="fa-regular fa-trash-can"></i></button></div>`;
                }

                if (!row.className) row.className = 'row revisao-grid';
                row.innerHTML = `
                    <span class="text-secondary">${codigo}</span>
                    <span class="bold">${nomeExibicao}</span>
                    <span class="text-secondary">${periodo}</span>
                    ${notaHtml}
                    <div class="status-pill ${statusClass}">${statusTxt}</div>
                    ${acoesHtml}
                `;
                rowsContainer.appendChild(row);
            });
        } catch (e) { console.error("Erro ao renderizar histórico:", e); }
        updateInterface();
    }

    // ==========================================
    // CONTROLE DE MODAL E EDIÇÃO DE LINHAS
    // ==========================================

    function showModal(title, text) {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-modal');
            document.getElementById('modal-title').textContent = title;
            document.getElementById('modal-text').textContent = text;
            modal.style.display = 'flex';

            document.getElementById('modal-btn-yes').onclick = () => { modal.style.display = 'none'; resolve(true); };
            document.getElementById('modal-btn-no').onclick = () => { modal.style.display = 'none'; resolve(false); };
        });
    }

    btnAddManual.addEventListener('click', () => {
        const newRow = document.createElement('div');
        newRow.className = 'row revisao-grid row-error';
        newRow.dataset.errorType = "pendente";
        newRow.dataset.isNew = "true"; 
        
        newRow.innerHTML = `
            <span>
                <div class="discipline-search-revisao">
                    <input type="text" class="edit-codigo" placeholder="CÓDIGO" autocomplete="off">
                    <div class="search-dropdown-revisao" hidden></div>
                </div>
            </span>
            <span><input type="text" class="edit-nome" placeholder="Nome da Disciplina" readonly tabindex="-1" style="opacity: 0.6; border: 1px dashed #334155;"></span>
            <span><input type="text" class="edit-periodo" placeholder="202X.X"></span>
            <span><input type="number" step="0.1" class="edit-nota" placeholder="0.0"></span>
            <div class="status-pill indefinido">INDEFINIDO</div>
            <div class="edit-actions">
                <button class="btn-cancel">Cancelar</button>
                <button class="btn-save">Salvar</button>
            </div>
        `;
        rowsContainer.appendChild(newRow);
        setupDropdownEventos(newRow);
        updateInterface();
    });

    rowsContainer.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const row = btn.closest('.row');

        if (btn.querySelector('.fa-trash-can')) {
            const conf = await showModal("Excluir", "Deseja excluir esta disciplina permanentemente?");
            if (conf) { row.remove(); updateInterface(); }
        } 
        else if (btn.classList.contains('btn-fix') || btn.querySelector('.fa-pen-to-square')) {
            enterEditMode(row);
        } 
        else if (btn.classList.contains('btn-save')) {
            saveRow(row);
        } 
        else if (btn.classList.contains('btn-cancel')) {
            cancelEdit(row);
        }
    });

    function enterEditMode(row) {
        if (row.classList.contains('row-editing')) return;
        row.dataset.originalHtml = row.innerHTML;

        const spans = row.querySelectorAll('span');
        const notaCell = row.querySelector('.blue-text') || row.querySelector('.error-text') || spans[3];
        
        const codigo = spans[0].textContent.trim() === '—' ? '' : spans[0].textContent.trim();
        const nome = spans[1].textContent.trim() === 'Disciplina sem nome' ? '' : spans[1].textContent.trim();
        const periodo = spans[2].textContent.trim() === '—' ? '' : spans[2].textContent.trim();
        let notaVal = notaCell.textContent.replace('N/A', '').replace('—', '').trim().replace(',', '.');

        row.classList.add('row-editing');
        spans[0].innerHTML = `
            <div class="discipline-search-revisao">
                <input type="text" class="edit-codigo" value="${codigo}" placeholder="CÓDIGO" autocomplete="off">
                <div class="search-dropdown-revisao" hidden></div>
            </div>`;
        spans[1].innerHTML = `<input type="text" class="edit-nome" value="${nome}" readonly tabindex="-1" style="opacity: 0.6; border: 1px dashed #334155;">`;
        spans[2].innerHTML = `<input type="text" class="edit-periodo" value="${periodo}" placeholder="202X.X">`;
        notaCell.innerHTML = `<input type="number" step="0.1" class="edit-nota" value="${notaVal}" placeholder="0.0">`;

        setupDropdownEventos(row);
        
        const actionArea = row.querySelector('.actions') || row.querySelector('.btn-fix');
        actionArea.outerHTML = `<div class="edit-actions"><button class="btn-cancel">Cancelar</button><button class="btn-save">Salvar</button></div>`;
    }

    function cancelEdit(row) {
        if (row.dataset.isNew === "true") { row.remove(); } 
        else { row.innerHTML = row.dataset.originalHtml; row.classList.remove('row-editing'); }
        updateInterface();
    }

    async function saveRow(row) {
        const inputCod = row.querySelector('.edit-codigo');
        const inputNota = row.querySelector('.edit-nota');
        const vCodigo = inputCod.value.toUpperCase();
        const vNotaStr = inputNota.value;
        const vNotaNum = parseFloat(vNotaStr.replace(',', '.'));

        inputCod.classList.remove('input-error');
        inputNota.classList.remove('input-error');

        if (codigosCatalogo.size && !codigosCatalogo.has(vCodigo)) {
            inputCod.classList.add('input-error');
            row.dataset.errorType = "codigo_catalogo"; row.classList.add('row-error');
            updateInterface(); return;
        }
        if (vNotaStr === "") {
            inputNota.classList.add('input-error');
            row.dataset.errorType = "nota"; row.classList.add('row-error');
            updateInterface(); return;
        }

        let statusTxt = vNotaNum >= 7 ? "APROVADO" : (vNotaNum < 5 ? "REPROVADO" : "");
        if (vNotaNum >= 5 && vNotaNum < 7) {
            const aprovado = await showModal("Validação", `A nota ${vNotaNum} exige confirmação. O aluno foi aprovado?`);
            statusTxt = aprovado ? "APROVADO" : "REPROVADO";
        }

        let statusCls = statusTxt.toLowerCase();
        row.classList.remove('row-editing', 'row-error');
        delete row.dataset.errorType; delete row.dataset.isNew; delete row.dataset.originalHtml;
        
        row.innerHTML = `
            <span class="text-secondary">${vCodigo}</span>
            <span class="bold">${row.querySelector('.edit-nome').value || nomesCatalogo.get(vCodigo) || 'Disciplina sem nome'}</span>
            <span class="text-secondary">${row.querySelector('.edit-periodo').value || '—'}</span>
            <span class="bold blue-text">${vNotaNum.toFixed(1)}</span>
            <div class="status-pill ${statusCls}">${statusTxt}</div>
            <div class="actions"><button class="btn-icon"><i class="fa-regular fa-pen-to-square"></i></button><button class="btn-icon"><i class="fa-regular fa-trash-can"></i></button></div>
        `;
        aplicarMarcacaoCatalogoNasLinhas();
        updateInterface();
    }

    function updateInterface() {
        const rows = document.querySelectorAll('.row');
        const stats = document.querySelectorAll('.stat-value');
        if (stats.length >= 2) {
            stats[0].textContent = rows.length;
            let soma = 0, count = 0;
            rows.forEach(r => {
                const n = parseFloat(r.querySelector('.blue-text')?.textContent.replace(',', '.') || "NaN");
                if (!isNaN(n)) { soma += n; count++; }
            });
            stats[1].textContent = count > 0 ? (soma / count).toFixed(1) : "0.0";
        }

        const erroRow = document.querySelector('.row-error');
        if (alertBox) {
            if (erroRow) {
                alertBox.style.display = 'flex';
                const type = erroRow.dataset.errorType;
                alertBox.querySelector('span').innerHTML = type === 'codigo_catalogo' 
                    ? "Corrija o <span class='bold'>código da disciplina</span> para um catálogo válido." 
                    : (type === 'nota' ? "Insira uma <span class='bold'>nota válida</span>." : "Detectamos registros incompletos.");
            } else { alertBox.style.display = 'none'; }
        }
        aplicarMarcacaoCatalogoNasLinhas();
        atualizarAlertaCatalogo();
    }

    // ==========================================
    // EXPORTAÇÃO E AVANÇO DE FLUXO
    // ==========================================

    function exportarHistoricoRevisado() {
        return Array.from(document.querySelectorAll('#rows-container .row')).map((row) => {
            const colunas = row.querySelectorAll('span');
            const codigo = (colunas[0]?.textContent || '').trim().toUpperCase();
            const nome = (colunas[1]?.textContent || '').trim();
            const periodo = (colunas[2]?.textContent || '').trim();
            const notaTexto = (colunas[3]?.textContent || '').trim().replace(',', '.');
            const status = (row.querySelector('.status-pill')?.textContent || '').trim().toUpperCase();
            const notaNumero = Number.parseFloat(notaTexto);

            return {
                codigo_disciplina: codigo,
                nome_disciplina: nome,
                ano_periodo_letivo: periodo,
                media: Number.isFinite(notaNumero) ? notaNumero : 0,
                situacao: status,
            };
        }).filter((item) => item.codigo_disciplina);
    }

    const btnAdvance = document.querySelector('.btn-advance');
    if (btnAdvance) {
        btnAdvance.addEventListener('click', async () => {
            const historicoRevisado = exportarHistoricoRevisado();
            if (!historicoRevisado.length) {
                window.alert('Nenhum dado de histórico foi carregado.'); return;
            }

            let historicoParaAvancar = historicoRevisado;
            if (codigosCatalogo.size) {
                const codigosHistorico = listarCodigosTabela();
                const foraCatalogo = [...new Set(codigosHistorico.filter((codigo) => !codigosCatalogo.has(codigo)))];
                if (foraCatalogo.length) {
                    const confirmarIgnorar = await showModal('Disciplinas fora do catálogo', `As disciplinas (${foraCatalogo.join(', ')}) serão ignoradas. Deseja continuar?`);
                    if (!confirmarIgnorar) return;
                    historicoParaAvancar = historicoRevisado.filter((item) => codigosCatalogo.has(String(item.codigo_disciplina).toUpperCase()));
                    if (!historicoParaAvancar.length) {
                        window.alert('Nenhuma disciplina válida restou após filtrar o catálogo.'); return;
                    }
                }
            }

            sessionStorage.setItem('historicoRevisado', JSON.stringify({
                total_disciplinas: historicoParaAvancar.length,
                disciplinas: historicoParaAvancar,
            }));

            const tipoFluxo = sessionStorage.getItem('tipoFluxo') || 'matricula';
            const proximaPagina = tipoFluxo === 'rematricula' ? 'tela_materias_conflitos.html' : 'tela_enfases.html';
            
            sessionStorage.setItem('currentStep', 3);
            window.location.href = proximaPagina;
        });
    }
});