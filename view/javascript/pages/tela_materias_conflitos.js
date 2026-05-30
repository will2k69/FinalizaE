const listaDisciplinas = {
    "COMP363": "Cálculo Diferencial e Integral",
    "COMP359": "Programação I",
    "COMP360": "Estrutura de Dados",
    "ENG102": "Física Experimental",
    "DIR001": "Ética e Cidadania",
    "MAT042": "Álgebra Linear",
    "SOFT200": "Engenharia de Software"
};

document.addEventListener('DOMContentLoaded', () => {
    const rowsContainer = document.getElementById('rows-container');
    const addRowBtn = document.getElementById('add-row');

    function salvarDados() {
        const dados = [];

        document.querySelectorAll('.row').forEach(row => {
            dados.push({
                codigo: row.querySelector('.input-codigo')?.value || '',
                nome: row.querySelector('.input-nome')?.value || ''
            });
        });

        sessionStorage.setItem(
            'disciplinasConcluidas',
            JSON.stringify(dados)
        );
    }

    function restaurarDados() {
        const dados = JSON.parse(
            sessionStorage.getItem('disciplinasConcluidas') || '[]'
        );

        if (dados.length === 0) {
            createRow();
            return;
        }

        dados.forEach(item => {
            const row = createRow();

            row.querySelector('.input-codigo').value = item.codigo;
            row.querySelector('.input-nome').value = item.nome;

            if (item.nome) {
                row.querySelector('.input-nome').classList.add('filled-auto');
            }
        });
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
                modalIconContainer.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
                modalIconContainer.style.color = '#10b981';
            } else {
                btnNo.style.display = 'block';
                btnNo.textContent = 'Não';
                btnYes.textContent = 'Sim';
                modalIconContainer.innerHTML = '<i class="fa-solid fa-circle-question"></i>';
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

        rows.forEach(row => {
            const inputCodigo = row.querySelector('.input-codigo');

            if (
                inputCodigo &&
                inputCodigo !== inputAtual &&
                inputCodigo.value.toUpperCase() === codigoDigitado
            ) {
                linhaDuplicada = row;
            }
        });

        if (linhaDuplicada) {
            const nomeMateria = listaDisciplinas[codigoDigitado];

            const substituir = await showModal(
                "Disciplina Duplicada",
                `A disciplina <b>${nomeMateria} (${codigoDigitado})</b> já foi adicionada.<br>Deseja remover a entrada anterior e manter apenas esta?`,
                false
            );

            if (substituir) {
                linhaDuplicada.style.transition = 'all 0.2s ease';
                linhaDuplicada.style.opacity = '0';
                linhaDuplicada.style.transform = 'translateX(20px)';

                setTimeout(() => {
                    linhaDuplicada.remove();
                    salvarDados();
                }, 200);

                await showModal(
                    "Sucesso",
                    "A entrada anterior foi substituída!",
                    true
                );
            } else {
                inputAtual.value = "";

                const inputNome = inputAtual
                    .closest('.row')
                    .querySelector('.input-nome');

                if (inputNome) {
                    inputNome.value = "";
                    inputNome.classList.remove('filled-auto');
                }

                salvarDados();
                inputAtual.focus();
            }
        }
    }

    function createRow() {
        const row = document.createElement('div');
        row.className = 'row';

        row.innerHTML = `
            <input type="text" placeholder="Código" class="input-codigo" list="disciplinas-list">
            <input type="text" placeholder="Nome da Disciplina" class="input-nome" readonly>
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
        const btnDelete = row.querySelector('.btn-delete');

        inputCodigo.addEventListener('input', async (e) => {
            const val = e.target.value.toUpperCase();

            if (listaDisciplinas[val]) {
                inputNome.value = listaDisciplinas[val];
                inputNome.classList.add('filled-auto');

                salvarDados();

                await verificarDuplicada(inputCodigo, val);
            } else {
                inputNome.value = "";
                inputNome.classList.remove('filled-auto');

                salvarDados();
            }
        });

        btnDelete.addEventListener('click', async () => {
            const nomeMateria = inputNome.value || "esta linha";

            const confirmarExclusao = await showModal(
                "Confirmar Exclusão",
                `Tem certeza que deseja remover ${nomeMateria}?`,
                false
            );

            if (confirmarExclusao) {
                row.style.transition = 'all 0.2s ease';
                row.style.opacity = '0';
                row.style.transform = 'translateX(20px)';

                setTimeout(() => {
                    row.remove();
                    salvarDados();
                }, 200);

                await showModal(
                    "Sucesso",
                    "Registro removido com sucesso!",
                    true
                );
            }
        });
    }

    addRowBtn.addEventListener('click', () => {
        createRow();
        salvarDados();
    });

    restaurarDados();
});
