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

    function salvarEstado() {
        const disciplinas = [];

        document.querySelectorAll('.row').forEach(row => {
            if (row.classList.contains('row-editing')) {
                disciplinas.push({
                    codigo: row.querySelector('.edit-codigo')?.value || '',
                    nome: row.querySelector('.edit-nome')?.value || '',
                    periodo: row.querySelector('.edit-periodo')?.value || '',
                    nota: row.querySelector('.edit-nota')?.value || '',
                    status: row.querySelector('.status-pill')?.textContent || 'INDEFINIDO',
                    editando: true
                });
            } else {
                disciplinas.push({
                    codigo: row.querySelector('.text-secondary')?.textContent || '',
                    nome: row.querySelector('.bold')?.textContent || '',
                    periodo: row.querySelectorAll('span')[2]?.textContent || '',
                    nota: row.querySelector('.blue-text')?.textContent || '',
                    status: row.querySelector('.status-pill')?.textContent || '',
                    editando: false
                });
            }
        });

        sessionStorage.setItem(
            'revisaoHistoricoTemp',
            JSON.stringify(disciplinas)
        );
    }

    function restaurarEstado() {
        const dados = sessionStorage.getItem('revisaoHistoricoTemp');

        if (!dados) return false;

        rowsContainer.innerHTML = '';

        JSON.parse(dados).forEach(item => {
            if (item.editando) {
                const row = document.createElement('div');

                row.className = 'row revisao-grid row-error';
                row.dataset.errorType = 'pendente';
                row.dataset.isNew = 'true';

                row.innerHTML = `
                <span><input type="text" class="edit-codigo" value="${item.codigo}" list="disciplinas-list"></span>
                <span><input type="text" class="edit-nome" value="${item.nome}" readonly tabindex="-1" style="opacity:0.6;border:1px dashed #334155;"></span>
                <span><input type="text" class="edit-periodo" value="${item.periodo}"></span>
                <span><input type="number" step="0.1" class="edit-nota" value="${item.nota}"></span>
                <div class="status-pill indefinido">${item.status}</div>
                <div class="edit-actions">
                    <button class="btn-cancel">Cancelar</button>
                    <button class="btn-save">Salvar</button>
                </div>
            `;

                rowsContainer.appendChild(row);
                setupAutocompleteInternal(row);
            } else {
                const statusClasse = item.status.toLowerCase();

                const row = document.createElement('div');

                row.className = 'row revisao-grid';

                row.innerHTML = `
                <span class="text-secondary">${item.codigo}</span>
                <span class="bold">${item.nome}</span>
                <span class="text-secondary">${item.periodo}</span>
                <span class="bold blue-text">${item.nota}</span>
                <div class="status-pill ${statusClasse}">
                    ${item.status}
                </div>
                <div class="actions">
                    <button class="btn-icon"><i class="fa-regular fa-pen-to-square"></i></button>
                    <button class="btn-icon"><i class="fa-regular fa-trash-can"></i></button>
                </div>
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
            if (listaDisciplinas[val]) {
                inputNom.value = listaDisciplinas[val];
                inputCod.classList.remove('input-error');

                await verificarDuplicadaEmTempoReal(inputCod, val);
            } else {
                inputNom.value = "";
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
                alertBox.querySelector('span').innerHTML = type === "codigo" ? "Corrija o <span class='bold'>código da disciplina</span>." : (type === "nota" ? "Insira uma <span class='bold'>nota válida</span>." : "Detectamos registros com informações incompletas.");
            } else {
                alertBox.style.display = 'none';
            }
        }
    }

    const btnAdvance = document.querySelector('.btn-advance');
    if (btnAdvance) {
        btnAdvance.addEventListener('click', () => {
            const tipoFluxo = sessionStorage.getItem('tipoFluxo') || 'matriula';
            const proximaPagina = tipoFluxo === 'rematriula' ? 'tela_materias_conflitos.html' : 'tela_enfases.html';
            sessionStorage.setItem('currentStep', 3);
            window.location.href = proximaPagina;
        });
    }
});
