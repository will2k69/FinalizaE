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

    // Função para criar uma nova linha na tabela
    function createRow() {
        const row = document.createElement('div');
        row.className = 'row';
        
        // Estrutura simplificada: Código, Nome e Botão Deletar
        row.innerHTML = `
            <input type="text" placeholder="Código" class="input-codigo" list="disciplinas-list">
            <input type="text" placeholder="Nome da Disciplina" class="input-nome" readonly>
            <button class="btn-delete" title="Remover">
                <i class="fa-regular fa-trash-can"></i>
            </button>
        `;
        
        rowsContainer.appendChild(row);
        setupRowEvents(row);
    }

    // Configura os eventos de cada linha
    function setupRowEvents(row) {
        const inputCodigo = row.querySelector('.input-codigo');
        const inputNome = row.querySelector('.input-nome');
        const btnDelete = row.querySelector('.btn-delete');

        // Autocomplete Inteligente baseado no objeto listaDisciplinas
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

        // Botão de deletar com animação simples
        btnDelete.addEventListener('click', () => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(20px)';
            setTimeout(() => row.remove(), 200);
        });
    }

    // Evento do botão de adicionar nova linha
    addRowBtn.addEventListener('click', createRow);

    // Inicializa a página com uma linha em branco
    createRow();
});