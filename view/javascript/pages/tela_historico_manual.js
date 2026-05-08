
const listaDisciplinas = {
    "COMP363": "Cálculo Diferencial e Integral",
    "COMP359": "Programação I",
    "COMP360": "Estrutura de Dados",
    "ENG102": "Física Experimental",
    "DIR001": "Ética e Cidadania",
    "MAT042": "Álgebra Linear",
    "SOFT200": "Engenharia de Software"
};

let currentRowToUpdate = null;

document.addEventListener('DOMContentLoaded', () => {
    const rowsContainer = document.getElementById('rows-container');
    const addRowBtn = document.getElementById('add-row');

    function createRow() {
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = `
            <input type="text" placeholder="Código" class="input-codigo" list="disciplinas-list">
            <input type="text" placeholder="Nome da Disciplina" class="input-nome" readonly>
            <input type="number" step="0.1" placeholder="0.0" class="input-nota">
            <div class="status">Pendente</div>
            <input type="text" placeholder="202X.X">
            <button class="btn-delete" title="Remover"><i class="fa-regular fa-trash-can"></i></button>
        `;
        
        rowsContainer.appendChild(row);
        setupRowEvents(row);
    }

    function setupRowEvents(row) {
        const inputCodigo = row.querySelector('.input-codigo');
        const inputNome = row.querySelector('.input-nome');
        const inputNota = row.querySelector('.input-nota');
        const statusDiv = row.querySelector('.status');
        const btnDelete = row.querySelector('.btn-delete');

        // Autocomplete Inteligente
        inputCodigo.addEventListener('input', (e) => {
            const val = e.target.value.toUpperCase();
            if (listaDisciplinas[val]) {
                inputNome.value = listaDisciplinas[val];
                inputNome.classList.add('filled-auto');
            } else {
                inputNome.value = "";
                inputNome.classList.remove('filled-auto');
            }
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
    createRow(); // Inicia com uma linha vazia

    // Evento para botão Continuar
    const btnContinue = document.querySelector('.btn-continue');
    if (btnContinue) {
        btnContinue.addEventListener('click', (e) => {
            e.preventDefault();

            // Coletar dados das linhas
            const rows = rowsContainer.querySelectorAll('.row');
            const disciplinas = [];

            rows.forEach(row => {
                const codigo = row.querySelector('.input-codigo').value;
                const nome = row.querySelector('.input-nome').value;
                const nota = row.querySelector('.input-nota').value;
                const status = row.querySelector('.status').textContent;
                const periodo = row.querySelector('input[placeholder="202X.X"]').value;

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

            // Armazenar histórico manual
            sessionStorage.setItem('historicoManual', JSON.stringify({ disciplinas }));

            // Avançar para step 2 (Revisão)
            sessionStorage.setItem('currentStep', 2);
            window.location.href = 'tela_revisao_historico.html';
        });
    }
});