/**
 * Gerencia a revisão manual do histórico antes da recomendação.
 *
 * Esta tela carrega o histórico extraído, valida códigos contra o catálogo,
 * permite correções manuais e exporta apenas os dados revisados para a próxima etapa.
 */
document.addEventListener('DOMContentLoaded', () => {
    const rowsContainer = document.getElementById('rows-container');
    const alertBox = document.querySelector('.alert-box');
    const btnAddManual = document.querySelector('.btn-add-manual');
    const alertCatalogo = document.getElementById('alert-catalogo');
    const alertCatalogoTexto = document.getElementById('alert-catalogo-texto');
    const API_BASE = typeof API_BASE_URL === 'string' ? API_BASE_URL : '';
    const CATALOGO_API_URL = `${API_BASE}/api/recomendacoes/catalogo-codigos`;
    let codigosCatalogo = new Set();
    let nomesCatalogo = new Map();

    function garantirDatalistCatalogo() {
        let datalist = document.getElementById('disciplinas-list');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'disciplinas-list';
            document.body.appendChild(datalist);
        }

        datalist.innerHTML = '';
        for (const codigo of codigosCatalogo) {
            const option = document.createElement('option');
            option.value = codigo;
            datalist.appendChild(option);
        }
    }

    // ==========================================
    // INTEGRAÇÃO: Carregar e Renderizar o JSON
    // ==========================================
    carregarHistoricoDoSessionStorage();
    carregarCatalogoCodigos();

    // Busca os códigos válidos do backend para marcar disciplinas fora do catálogo atual.
    async function carregarCatalogoCodigos() {
        try {
            const response = await fetch(CATALOGO_API_URL);
            if (!response.ok) {
                throw new Error('Falha ao carregar catálogo de disciplinas.');
            }
            const payload = await response.json();
            const lista = Array.isArray(payload.codigos) ? payload.codigos : [];
            codigosCatalogo = new Set(lista.map((c) => String(c).toUpperCase().trim()));
            nomesCatalogo = new Map(lista.map((c) => [String(c).toUpperCase().trim(), String(c).toUpperCase().trim()]));
            garantirDatalistCatalogo();
            aplicarMarcacaoCatalogoNasLinhas();
            atualizarAlertaCatalogo();
        } catch (_) {
            codigosCatalogo = new Set();
            nomesCatalogo = new Map();
            if (alertCatalogo && alertCatalogoTexto) {
                alertCatalogo.style.display = 'flex';
                alertCatalogoTexto.textContent = 'Não foi possível validar o catálogo de disciplinas da recomendação no momento.';
            }
        }
    }

    function aplicarMarcacaoCatalogoNasLinhas() {
        if (!codigosCatalogo.size) {
            return;
        }

        const rows = Array.from(document.querySelectorAll('#rows-container .row'));
        rows.forEach((row) => {
            if (row.classList.contains('row-editing')) {
                return;
            }

            const codigo = (row.querySelector('span')?.textContent || '').trim().toUpperCase();
            if (!codigo || codigo === '—') {
                return;
            }

            const isValido = codigosCatalogo.has(codigo);
            const erroAtual = row.dataset.errorType || '';

            if (!isValido && erroAtual !== 'nota') {
                row.classList.add('row-error');
                row.dataset.errorType = 'codigo_catalogo';

                const statusPill = row.querySelector('.status-pill');
                if (statusPill) {
                    statusPill.className = 'status-pill indefinido';
                    statusPill.textContent = 'NÃO VALIDADO';
                }

                const actions = row.querySelector('.actions');
                if (actions) {
                    actions.outerHTML = '<button class="btn-fix">Corrigir</button>';
                }
                return;
            }

            if (isValido && erroAtual === 'codigo_catalogo') {
                row.classList.remove('row-error');
                delete row.dataset.errorType;

                const btnFix = row.querySelector('.btn-fix');
                if (btnFix) {
                    btnFix.outerHTML = `
                        <div class="actions">
                            <button class="btn-icon"><i class="fa-regular fa-pen-to-square"></i></button>
                            <button class="btn-icon"><i class="fa-regular fa-trash-can"></i></button>
                        </div>`;
                }
            }
        });
    }

    function listarCodigosTabela() {
        const rows = Array.from(document.querySelectorAll('#rows-container .row'));
        return rows
            .map((row) => (row.querySelector('span')?.textContent || '').trim().toUpperCase())
            .filter(Boolean);
    }

    function atualizarAlertaCatalogo() {
        if (!alertCatalogo || !alertCatalogoTexto) {
            return;
        }

        if (!codigosCatalogo.size) {
            return;
        }

        const codigosHistorico = listarCodigosTabela();
        const foraCatalogo = [...new Set(codigosHistorico.filter((codigo) => !codigosCatalogo.has(codigo)))].sort();

        if (!foraCatalogo.length) {
            alertCatalogo.style.display = 'none';
            return;
        }

        alertCatalogo.style.display = 'flex';
        alertCatalogoTexto.textContent = `Esses códigos não existem no catálogo atual da recomendação e serão ignorados: ${foraCatalogo.join(', ')}`;
    }

    // Renderiza o histórico salvo e tenta inferir status a partir da situação textual ou da nota.
    function carregarHistoricoDoSessionStorage() {
    // 1. Limpa as linhas estáticas do HTML original
    rowsContainer.innerHTML = '';

    const dadosRaw = sessionStorage.getItem("historicoExtraido") || sessionStorage.getItem("historicoRevisado");
    if (!dadosRaw) {
        rowsContainer.innerHTML = `<div class="row revisao-grid"><span class="text-secondary">—</span><span class="bold">Nenhum histórico carregado</span><span class="text-secondary">—</span><span class="text-secondary">—</span><div class="status-pill indefinido">INDEFINIDO</div><div class="actions"></div></div>`;
        updateInterface();
        return;
    }

    try {
        let materias = JSON.parse(dadosRaw);

        // Garante o tratamento como Array
        if (materias && !Array.isArray(materias)) {
            if (Array.isArray(materias.disciplinas)) materias = materias.disciplinas;
            else if (Array.isArray(materias.materias)) materias = materias.materias;
            else if (Array.isArray(materias.historico)) materias = materias.historico;
            else if (Array.isArray(materias.data)) materias = materias.data;
        }

        const listaMaterias = Array.isArray(materias) ? materias : [materias];

        // Mapeador auxiliar para aceitar variações de chaves da API (com/sem acento, maiúsculas/minúsculas)
        const extrairCampo = (obj, chavesPossiveis) => {
            for (let chave of chavesPossiveis) {
                if (obj[chave] !== undefined && obj[chave] !== null) return obj[chave];
            }
            return undefined;
        };

        listaMaterias.forEach(materia => {
            if (!materia) return;

            const row = document.createElement('div');
            
            // Extração tolerante a variações do seu Back-end
            const codRaw = extrairCampo(materia, ['codigo_disciplina', 'codigo', 'código', 'CODIGO_DISCIPLINA']);
            const codigo = codRaw ? String(codRaw).toUpperCase().trim() : "—";
            
            const nomeRaw = extrairCampo(materia, ['nome_disciplina', 'nome', 'NOME_DISCIPLINA']);
            const nomeExibicao = nomeRaw || nomesCatalogo.get(codigo) || "Disciplina sem nome";
            
            const perRaw = extrairCampo(materia, ['ano_periodo_letivo', 'periodo', 'período', 'ANO_PERIODO_LETIVO']);
            const periodo = perRaw ? String(perRaw).trim() : "—";
            
            const situacaoRaw = extrairCampo(materia, ['situacao', 'situação', 'SITUACAO', 'SITUAÇÃO', 'status', 'STATUS']);
            const situacaoApi = situacaoRaw ? String(situacaoRaw).toUpperCase().trim() : "";
            
            const mediaRaw = extrairCampo(materia, ['media', 'média', 'MEDIA', 'MÉDIA', 'nota', 'NOTA']);
            let mediaStr = mediaRaw !== undefined && mediaRaw !== null ? String(mediaRaw).trim() : "-";

            let notaHtml = '';
            let statusClass = 'indefinido';
            let statusTxt = 'INDEFINIDO';
            let acoesHtml = '';

            // 1. TENTA IDENTIFICAR O STATUS TEXTUAL VINDO DA API
            if (situacaoApi.includes("APROV") || situacaoApi.includes("DISP") || situacaoApi.includes("EQUIV")) {
                statusClass = "aprovado";
                statusTxt = "APROVADO";
            } else if (situacaoApi.includes("REPROV")) {
                statusClass = "reprovado";
                statusTxt = "REPROVADO";
            } else if (situacaoApi.includes("MATRIC") || situacaoApi.includes("CURS")) {
                statusClass = "cursando";
                statusTxt = "MATRICULADO";
            } 
            // PLANO B: Se a situação veio vazia, tenta deduzir pela nota numérica
            else if (mediaStr !== "-" && mediaStr !== "" && mediaStr.toUpperCase() !== "N/A") {
                const notaDeducao = parseFloat(mediaStr.replace(',', '.'));
                if (!isNaN(notaDeducao)) {
                    if (notaDeducao >= 7.0) {
                        statusClass = "aprovado";
                        statusTxt = "APROVADO";
                    } else if (notaDeducao < 5.0) {
                        statusClass = "reprovado";
                        statusTxt = "REPROVADO";
                    }
                }
            }

            // 2. MONTA A RENDERIZAÇÃO VISUAL BASEADA NO STATUS FILTRADO
            if (statusTxt === "MATRICULADO") {
                notaHtml = `<span class="text-secondary">—</span>`;
                acoesHtml = `
                    <div class="actions">
                        <button class="btn-icon"><i class="fa-regular fa-pen-to-square"></i></button>
                        <button class="btn-icon"><i class="fa-regular fa-trash-can"></i></button>
                    </div>`;
            } 
            // Se a nota for um traço/vazia
            else if (mediaStr === "-" || mediaStr === "" || mediaStr.toUpperCase() === "N/A") {
                if (statusTxt === "APROVADO") {
                    notaHtml = `<span class="text-secondary">—</span>`; // Aprovado sem nota (Equivalência/Dispensa)
                    acoesHtml = `
                        <div class="actions">
                            <button class="btn-icon"><i class="fa-regular fa-pen-to-square"></i></button>
                            <button class="btn-icon"><i class="fa-regular fa-trash-can"></i></button>
                        </div>`;
                } else {
                    // Erro real de leitura: Sem nota e sem situação válida
                    row.className = 'row revisao-grid row-error';
                    row.dataset.errorType = "nota";
                    statusClass = "indefinido";
                    statusTxt = "INDEFINIDO";
                    notaHtml = `<span class="bold error-text"><span class="dot"></span> N/A</span>`;
                    acoesHtml = `<button class="btn-fix">Corrigir</button>`;
                }
            } 
            // Se possuir nota numérica normal
            else {
                const notaNum = parseFloat(mediaStr.replace(',', '.'));
                
                if (isNaN(notaNum)) {
                    row.className = 'row revisao-grid row-error';
                    row.dataset.errorType = "nota";
                    statusClass = "indefinido";
                    statusTxt = "INDEFINIDO";
                    notaHtml = `<span class="bold error-text"><span class="dot"></span> N/A</span>`;
                    acoesHtml = `<button class="btn-fix">Corrigir</button>`;
                } else {
                    notaHtml = `<span class="bold blue-text">${notaNum.toFixed(1)}</span>`;
                    acoesHtml = `
                        <div class="actions">
                            <button class="btn-icon"><i class="fa-regular fa-pen-to-square"></i></button>
                            <button class="btn-icon"><i class="fa-regular fa-trash-can"></i></button>
                        </div>`;
                }
            }

            // Define classe padrão de linha se não for uma linha de erro
            if (!row.className) {
                row.className = 'row revisao-grid';
            }

            // Injeta a estrutura respeitando as classes do CSS
            row.innerHTML = `
                <span class="text-secondary">${codigo}</span>
                <span class="bold">${nomeExibicao}</span>
                <span class="text-secondary">${periodo}</span>
                ${notaHtml}
                <div class="status-pill ${statusClass}">${statusTxt}</div>
                ${acoesHtml}
            `;

                rowsContainer.appendChild(row);
            }
        });

        return true;
    }

    if (!restaurarEstado()) {
        updateInterface();
    }

    updateInterface();

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
                modalIconContainer.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
                modalIconContainer.style.color = '#10b981';
            } else {
                btnNo.style.display = 'block';
                btnYes.textContent = 'Sim';
                modalIconContainer.innerHTML = '<i class="fa-solid fa-circle-question"></i>';
                modalIconContainer.style.color = 'var(--accent-blue)';
            }

            btnYes.onclick = () => { modal.style.display = 'none'; resolve(true); };
            btnNo.onclick = () => { modal.style.display = 'none'; resolve(false); };
        });
    }

    async function verificarDuplicadaEmTempoReal(inputAtual, codigoDigitado) {
        const todasAsLinhas = document.querySelectorAll('.row');
        let linhaDuplicada = null;

        todasAsLinhas.forEach(linhaExistente => {
            if (linhaExistente !== inputAtual.closest('.row')) {
                const codigoSalvo = linhaExistente.querySelector('.text-secondary')?.textContent.trim().toUpperCase();
                const codigoEditando = linhaExistente.querySelector('.edit-codigo')?.value.trim().toUpperCase();
                const codigoFinal = codigoSalvo || codigoEditando;

                if (codigoFinal === codigoDigitado) {
                    linhaDuplicada = linhaExistente;
                }
            }
        });

        if (linhaDuplicada) {
            const nomeMateria = listaDisciplinas[codigoDigitado];
            const substituir = await showModal(
                "Disciplina Duplicada",
                `A disciplina <b>${nomeMateria} (${codigoDigitado})</b> já consta na lista.<br>Deseja remover a versão anterior e manter esta?`
            );

            if (substituir) {
                linhaDuplicada.style.transition = 'all 0.2s ease';
                linhaDuplicada.style.opacity = '0';
                linhaDuplicada.style.transform = 'translateX(20px)';

                setTimeout(() => {
                    linhaDuplicada.remove();
                    updateInterface();
                }, 200);

                await showModal("Sucesso", "O registro anterior foi substituído pelo atual.", true);
            } else {
                inputAtual.value = "";
                const row = inputAtual.closest('.row');
                const inputNom = row.querySelector('.edit-nome');
                if (inputNom) inputNom.value = "";
                inputAtual.focus();
            }
        }
    }

    btnAddManual.addEventListener('click', () => {
        const newRow = document.createElement('div');
        newRow.className = 'row revisao-grid row-error';
        newRow.dataset.errorType = "pendente";
        newRow.dataset.isNew = "true";

        newRow.innerHTML = `
            <span><input type="text" class="edit-codigo" placeholder="CÓDIGO" list="disciplinas-list"></span>
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
        setupAutocompleteInternal(newRow);
        updateInterface();
        salvarEstado();
    });

    rowsContainer.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const row = btn.closest('.row');

        if (btn.querySelector('.fa-trash-can')) {
            const nomeDisciplina = row.querySelectorAll('span')[1]?.textContent.trim() || "este item";
            const confirmacao = await showModal("Confirmar Exclusão", `Tem certeza que deseja excluir ${nomeDisciplina}?`);
            if (confirmacao) {
                row.remove();
                updateInterface();
                salvarEstado();
                await showModal("Sucesso", "Registro removido com sucesso", true);
            }
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

    function setupAutocompleteInternal(row) {
        const inputCod = row.querySelector('.edit-codigo');
        const inputPeriodo = row.querySelector('.edit-periodo');
        const inputNota = row.querySelector('.edit-nota');
        const anoAtual = new Date().getFullYear();

        if (inputNota) {
            inputNota.setAttribute('min', '0');
            inputNota.setAttribute('max', '10');

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
            });
        }

        if (inputPeriodo) {
            inputPeriodo.setAttribute('maxlength', '6');

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
            });
        }
        const inputNom = row.querySelector('.edit-nome');

        inputCod.addEventListener('input', async (e) => {
            const val = e.target.value.toUpperCase();
            if (nomesCatalogo.has(val)) {
                inputNom.value = nomesCatalogo.get(val) || val;
                inputCod.classList.remove('input-error');
                if (row.dataset.errorType === 'codigo_catalogo') {
                    row.classList.remove('row-error');
                    delete row.dataset.errorType;
                }
            }
        });
    }

    function enterEditMode(row) {
        if (row.classList.contains('row-editing')) return;

        row.dataset.originalHtml = row.innerHTML;

        const spans = row.querySelectorAll('span');
        const notaCell = row.querySelector('.blue-text') || row.querySelector('.error-text') || spans[3];

        const codigo = spans[0].textContent.trim();
        const nome = spans[1].textContent.trim();
        const periodo = spans[2].textContent.trim();
        let notaVal = notaCell.textContent.replace('N/A', '').replace('—', '').trim().replace(',', '.');

        row.classList.add('row-editing');
        spans[0].innerHTML = `<input type="text" class="edit-codigo" value="${codigo}" list="disciplinas-list">`;
        spans[1].innerHTML = `<input type="text" class="edit-nome" value="${nome}" readonly tabindex="-1" style="opacity: 0.6; border: 1px dashed #334155;">`;
        spans[2].innerHTML = `<input type="text" class="edit-periodo" value="${periodo}">`;
        notaCell.innerHTML = `<input type="number" step="0.1" class="edit-nota" value="${notaVal}">`;

        setupAutocompleteInternal(row);

        const actionArea = row.querySelector('.actions') || row.querySelector('.btn-fix');
        actionArea.outerHTML = `
            <div class="edit-actions">
                <button class="btn-cancel">Cancelar</button>
                <button class="btn-save">Salvar</button>
            </div>`;
    }

    function cancelEdit(row) {
        if (row.dataset.isNew === "true") {
            row.remove();
        } else {
            row.innerHTML = row.dataset.originalHtml;
            row.classList.remove('row-editing');
        }
        salvarEstado();
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
            row.dataset.errorType = "codigo_catalogo";
            row.classList.add('row-error');
            updateInterface();
            return;
        }

        if (vNotaStr === "") {
            inputNota.classList.add('input-error');
            row.dataset.errorType = "nota";
            row.classList.add('row-error');
            updateInterface();
            return;
        }

        const todasAsLinhas = document.querySelectorAll('.row');
        let linhaDuplicadaAnterior = null;

        todasAsLinhas.forEach(linhaExistente => {
            if (linhaExistente !== row) {
                const codigoExistente = linhaExistente.querySelector('.text-secondary')?.textContent.trim().toUpperCase();
                if (codigoExistente === vCodigo) {
                    linhaDuplicadaAnterior = linhaExistente;
                }
            }
        });

        if (linhaDuplicadaAnterior) {
            const substituir = await showModal("Substituir Registro", `Já existe um registro semelhante a ${listaDisciplinas[vCodigo]}. Deseja substituir?`);
            if (!substituir) {
                return;
            } else {
                linhaDuplicadaAnterior.remove();
            }
        }

        let statusTxt = "";
        if (vNotaNum >= 7) {
            statusTxt = "APROVADO";
        } else if (vNotaNum < 5) {
            statusTxt = "REPROVADO";
        } else {
            const aprovado = await showModal("Validação", `A nota ${vNotaNum} exige confirmação. O aluno foi aprovado?`);
            statusTxt = aprovado ? "APROVADO" : "REPROVADO";
        }

        let statusCls = statusTxt.toLowerCase();
        row.classList.remove('row-editing', 'row-error');
        delete row.dataset.errorType;
        delete row.dataset.isNew;
        delete row.dataset.originalHtml;

        row.innerHTML = `
            <img src="" style="display:none;" onerror="this.nextElementSibling.textContent='${vCodigo}';this.remove();">
            <span class="text-secondary">${vCodigo}</span>
            <span class="bold">${row.querySelector('.edit-nome').value || nomesCatalogo.get(vCodigo) || 'Disciplina sem nome'}</span>
            <span class="text-secondary">${row.querySelector('.edit-periodo').value || '—'}</span>
            <span class="bold blue-text">${vNotaNum.toFixed(1)}</span>
            <div class="status-pill ${statusCls}">${statusTxt}</div>
            <div class="actions">
                <button class="btn-icon"><i class="fa-regular fa-pen-to-square"></i></button>
                <button class="btn-icon"><i class="fa-regular fa-trash-can"></i></button>
            </div>
        `;
        aplicarMarcacaoCatalogoNasLinhas();
        updateInterface();
        salvarEstado();
        await showModal("Sucesso", "Registro criado com sucesso", true);
    }

    function updateInterface() {
        const rows = document.querySelectorAll('.row');
        const totalStat = document.querySelectorAll('.stat-value')[0];
        if (totalStat) totalStat.textContent = rows.length;

        let soma = 0, count = 0;
        rows.forEach(r => {
            const n = parseFloat(r.querySelector('.blue-text')?.textContent.replace(',', '.') || "NaN");
            if (!isNaN(n)) { soma += n; count++; }
        });

        const mediaStat = document.querySelectorAll('.stat-value')[1];
        if (mediaStat) mediaStat.textContent = count > 0 ? (soma / count).toFixed(1) : "0.0";

        const erroRow = document.querySelector('.row-error');
        if (alertBox) {
            if (erroRow) {
                alertBox.style.display = 'flex';
                const type = erroRow.dataset.errorType;
                if (type === 'codigo_catalogo') {
                    alertBox.querySelector('span').innerHTML = "Corrija o <span class='bold'>código da disciplina</span> para um código válido do catálogo.";
                } else if (type === 'codigo') {
                    alertBox.querySelector('span').innerHTML = "Corrija o <span class='bold'>código da disciplina</span>.";
                } else if (type === 'nota') {
                    alertBox.querySelector('span').innerHTML = "Insira uma <span class='bold'>nota válida</span>.";
                } else {
                    alertBox.querySelector('span').innerHTML = "Detectamos registros com informações incompletas.";
                }
            } else { 
                alertBox.style.display = 'none'; 
            }
        }

        aplicarMarcacaoCatalogoNasLinhas();
        atualizarAlertaCatalogo();
    }

    // Gera a versão consolidada do histórico que será usada nas telas seguintes.
    function exportarHistoricoRevisado() {
        const rows = Array.from(document.querySelectorAll('#rows-container .row'));
        return rows.map((row) => {
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

    // Navegação para a próxima tela
    const btnAdvance = document.querySelector('.btn-advance');
    if (btnAdvance) {
        btnAdvance.addEventListener('click', async () => {
            const historicoRevisado = exportarHistoricoRevisado();
            if (!historicoRevisado.length) {
                window.alert('Nenhum dado de histórico foi carregado. Volte para a tela de envio e importe o histórico.');
                return;
            }

            let historicoParaAvancar = historicoRevisado;
            if (codigosCatalogo.size) {
                const codigosHistorico = listarCodigosTabela();
                const foraCatalogo = [...new Set(codigosHistorico.filter((codigo) => !codigosCatalogo.has(codigo)))];
                if (foraCatalogo.length) {
                    const confirmarIgnorar = await showModal(
                        'Disciplinas fora do catálogo',
                        `As disciplinas (${foraCatalogo.join(', ')}) não estão no catálogo atual e serão ignoradas na recomendação. Deseja continuar?`
                    );

                    if (!confirmarIgnorar) {
                        return;
                    }

                    historicoParaAvancar = historicoRevisado.filter((item) => codigosCatalogo.has(String(item.codigo_disciplina).toUpperCase()));
                    if (!historicoParaAvancar.length) {
                        window.alert('Após ignorar as disciplinas fora do catálogo, não restou nenhuma disciplina válida para gerar recomendação.');
                        return;
                    }
                }
            }

            sessionStorage.setItem(
                'historicoRevisado',
                JSON.stringify({
                    total_disciplinas: historicoParaAvancar.length,
                    disciplinas: historicoParaAvancar,
                })
            );

            const tipoFluxo = sessionStorage.getItem('tipoFluxo') || 'matricula';
            const proximaPagina = tipoFluxo === 'rematricula'
                ? 'tela_materias_conflitos.html'
                : 'tela_enfases.html';
            
            sessionStorage.setItem('currentStep', 3);
            window.location.href = proximaPagina;
        });
    }
});
