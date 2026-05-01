const listaDisciplinas = {
    "COMP363": "Cálculo Diferencial e Integral",
    "COMP359": "Programação I",
    "COMP360": "Estrutura de Dados",
    "ENG102": "Física Experimental",
    "DIR001": "Ética e Cidadania",
    "MAT101": "Geometria Analítica",
    "ADM202": "Gestão de Projetos",
    "ECOM006": "Introdução à Engenharia da Computação",
    "COMP361": "Computação, Sociedade e Ética"
};

document.addEventListener('DOMContentLoaded', () => {
    const rowsContainer = document.getElementById('rows-container');
    const alertBox = document.querySelector('.alert-box');
    const btnAddManual = document.querySelector('.btn-add-manual');

    updateInterface();

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

    // Adicionar Nova Linha
    btnAddManual.addEventListener('click', () => {
        const newRow = document.createElement('div');
        newRow.className = 'row revisao-grid row-error';
        newRow.dataset.errorType = "pendente";
        newRow.dataset.isNew = "true"; // Marca como nova linha
        
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

    // Cliques na Tabela
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

        // Salva o HTML original para o caso de cancelar
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
            // Se for uma linha nova que nunca foi salva, remove ela
            row.remove();
        } else {
            // Se for uma edição de linha existente, restaura o HTML original
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

    // Event listener para botão "Confirmar e Avançar"
    const btnAdvance = document.querySelector('.btn-advance');
    if (btnAdvance) {
        btnAdvance.addEventListener('click', () => {
            const tipoFluxo = sessionStorage.getItem('tipoFluxo') || 'matriula';
            
            // Determinar próxima página baseado no fluxo
            const proximaPagina = tipoFluxo === 'rematriula' 
                ? 'tela_rematricula.html' 
                : 'tela_enfases.html';
            
            // Próximo passo é Análise (step 3) em ambos os fluxos
            const proximoStep = 3;
            
            sessionStorage.setItem('currentStep', proximoStep);
            window.location.href = proximaPagina;
        });
    }
});