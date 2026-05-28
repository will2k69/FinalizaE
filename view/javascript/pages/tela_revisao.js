const listaDisciplinas = {
    "COMP363": "Cálculo Diferencial e Integral",
    "COMP359": "Programação I",
    "COMP360": "Estrutura de Dados",
    "ENG102": "Física Experimental",
    "DIR001": "Ética e Cidadania",
    "MAT101": "Geometria Analítica",
    "ADM202": "Gestão de Projetos",
    "ECOM006": "Introdução à Engenharia da Computação",
    "COMP361": "Computação, Sociedade e Ética",
    "COMP373": "Programação III" // Adicionado o código de exemplo que você enviou
};

document.addEventListener('DOMContentLoaded', () => {
    const rowsContainer = document.getElementById('rows-container');
    const alertBox = document.querySelector('.alert-box');
    const btnAddManual = document.querySelector('.btn-add-manual');

    // ==========================================
    // INTEGRAÇÃO: Carregar e Renderizar o JSON
    // ==========================================
    carregarHistoricoDoSessionStorage();

   function carregarHistoricoDoSessionStorage() {
    // 1. Limpa as linhas estáticas do HTML original
    rowsContainer.innerHTML = '';

    const dadosRaw = sessionStorage.getItem("historicoExtraido");
    if (!dadosRaw) {
        console.warn("Nenhum dado de histórico encontrado no sessionStorage.");
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
            const nomeExibicao = listaDisciplinas[codigo] || nomeRaw || "Disciplina Desconhecida";
            
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
        });

    } catch (e) {
        console.error("Erro crítico ao renderizar o histórico:", e);
    }

    // Atualiza contadores e médias do cabeçalho
    updateInterface();
}

    // ==========================================
    // FUNÇÕES DO SEU SCRIPT ORIGINAL (PRESERVADAS)
    // ==========================================

    // Função para mostrar Modal (Canvas Interno)
    function showModal(title, text) {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-modal');
            const btnYes = document.getElementById('modal-btn-yes');
            const btnNo = document.getElementById('modal-btn-no');
            
            document.getElementById('modal-title').textContent = title;
            document.getElementById('modal-text').textContent = text;
            modal.style.display = 'flex';

            btnYes.onclick = () => { modal.style.display = 'none'; resolve(true); };
            btnNo.onclick = () => { modal.style.display = 'none'; resolve(false); };
        });
    }

    // Adicionar Nova Linha Manual
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
    });

    // Cliques na Tabela (Excluir, Corrigir/Editar, Salvar, Cancelar)
    rowsContainer.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const row = btn.closest('.row');

        if (btn.querySelector('.fa-trash-can')) {
            const confirmacao = await showModal("Excluir", "Deseja excluir esta disciplina permanentemente?");
            if (confirmacao) { row.remove(); updateInterface(); }
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
        const inputNom = row.querySelector('.edit-nome');
        inputCod.addEventListener('input', (e) => {
            const val = e.target.value.toUpperCase();
            if (listaDisciplinas[val]) {
                inputNom.value = listaDisciplinas[val];
                inputCod.classList.remove('input-error');
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

        if (!listaDisciplinas[vCodigo]) {
            inputCod.classList.add('input-error');
            row.dataset.errorType = "codigo";
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
            <span class="text-secondary">${vCodigo}</span>
            <span class="bold">${listaDisciplinas[vCodigo]}</span>
            <span class="text-secondary">${row.querySelector('.edit-periodo').value || '—'}</span>
            <span class="bold blue-text">${vNotaNum.toFixed(1)}</span>
            <div class="status-pill ${statusCls}">${statusTxt}</div>
            <div class="actions">
                <button class="btn-icon"><i class="fa-regular fa-pen-to-square"></i></button>
                <button class="btn-icon"><i class="fa-regular fa-trash-can"></i></button>
            </div>
        `;
        updateInterface();
    }

    function updateInterface() {
        const rows = document.querySelectorAll('.row');
        document.querySelectorAll('.stat-value')[0].textContent = rows.length;

        let soma = 0, count = 0;
        rows.forEach(r => {
            const n = parseFloat(r.querySelector('.blue-text')?.textContent.replace(',', '.') || "NaN");
            if (!isNaN(n)) { soma += n; count++; }
        });
        document.querySelectorAll('.stat-value')[1].textContent = count > 0 ? (soma / count).toFixed(1) : "0.0";

        const erroRow = document.querySelector('.row-error');
        if (alertBox) {
            if (erroRow) {
                alertBox.style.display = 'flex';
                const type = erroRow.dataset.errorType;
                alertBox.querySelector('span').innerHTML = type === "codigo" ? "Corrija o <span class='bold'>código da disciplina</span>." : (type === "nota" ? "Insira uma <span class='bold'>nota válida</span>." : "Detectamos registros com informações incompletas.");
            } else { 
                alertBox.style.display = 'none'; 
            }
        }
    }

    // Navegação para a próxima tela
    const btnAdvance = document.querySelector('.btn-advance');
    if (btnAdvance) {
        btnAdvance.addEventListener('click', () => {
            const tipoFluxo = sessionStorage.getItem('tipoFluxo') || 'matricula';
            const proximaPagina = tipoFluxo === 'rematriula' 
                ? 'tela_materias_conflitos.html' 
                : 'tela_enfases.html'; 
            
            sessionStorage.setItem('currentStep', 3);
            window.location.href = proximaPagina;
        });
    }
});