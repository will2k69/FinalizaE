// dados genéricos para simualação - no entanto pode vim de outra fonte
const meuPlanoData = {
    progresso: 72,
    tempoRestante: "Mais 2 semestres para o diploma.",
    resumo: {
        creditos: 42,
        meses: 12,
        iraEst: "+0.4 est."
    },
    planejamento: [
        {
            semestre: "2024.2",
            ordem: "01",
            statusCarga: "360h - MODERADA",
            tipoCarga: "highlight", // Amarelo
            disciplinas: [
                { nome: "Estrutura de Dados", horas: "72h", tipo: "pendencia", tag: "PENDÊNCIA ANTERIOR", info: "Não cursada no semestre anterior. Essencial para fluxo.", icon: "fa-triangle-exclamation" },
                { nome: "Cálculo II", horas: "60h", tipo: "obrigatoria", tag: "OBRIGATÓRIA", info: "Início do ciclo de conclusão de curso.", icon: "fa-star" },
                { nome: "Libras", horas: "72h", tipo: "eletiva", tag: "ELETIVA" }
            ]
        },
        {
            semestre: "2025.1",
            ordem: "02",
            statusCarga: "420h (Alta)",
            tipoCarga: "highlight-high", // Branco/Cinza
            disciplinas: [
                { nome: "Projeto e Desenvolvimento de Sistemas", horas: "120h", tipo: "obrigatoria", tag: "OBRIGATÓRIA", info: "Início do ciclo de conclusão de curso.", icon: "fa-star" },
                { nome: "Banco de Dados II", horas: "40h", tipo: "eletiva", tag: "ELETIVA" }
            ]
        }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    renderizarDashboard(meuPlanoData);
    setupAcoes();
});

// FUNÇÃO DE RENDERIZAÇÃO GENÉRICA
function renderizarDashboard(data) {
    // Atualiza Sidebar
    document.getElementById('display-percent').innerText = `${data.progresso}%`;
    document.getElementById('display-tempo-restante').innerText = data.tempoRestante;
    document.getElementById('resumo-creditos').innerText = data.resumo.creditos;
    document.getElementById('resumo-tempo').innerText = `${data.resumo.meses} meses`;
    document.getElementById('resumo-ira').innerText = data.resumo.iraEst;
    
    const progressBar = document.getElementById('progress-fill-results');
    setTimeout(() => progressBar.style.width = `${data.progresso}%`, 300);

    // Renderiza Semestres e Cards
    const container = document.getElementById('timeline-container');
    container.innerHTML = ''; 

    data.planejamento.forEach(sem => {
        const semesterDiv = document.createElement('div');
        semesterDiv.className = 'semester-group';
        
        semesterDiv.innerHTML = `
            <div class="semester-title">
                <span class="badge-number">${sem.ordem}</span>
                <div>
                    <h3>Semestre ${sem.semestre}</h3>
                    <p>Carga Horária Total: <span class="${sem.tipoCarga}">${sem.statusCarga}</span></p>
                </div>
            </div>
            <div class="cards-grid">
                ${sem.disciplinas.map(disc => `
                    <div class="card-subject">
                        <div class="card-tag ${disc.tipo}">
                            ${disc.tag} <span class="hours">${disc.horas}</span>
                        </div>
                        <h4>${disc.nome}</h4>
                        ${disc.info ? `
                            <div class="card-info ${disc.tipo === 'pendencia' ? 'warning' : ''}">
                                <i class="fa-solid ${disc.icon}"></i>
                                <span>${disc.info}</span>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(semesterDiv);
    });
}

// CONFIGURAÇÃO DE BOTÕES
function setupAcoes() {
    document.getElementById('btn-pdf').addEventListener('click', () => window.print());
    
    document.getElementById('btn-json').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(meuPlanoData, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "meu_plano_academico.json";
        a.click();
    });

    // Handlers para botões de volta (se existirem)
    const btnBack = document.querySelector('.btn-back');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            const tipoFluxo = sessionStorage.getItem('tipoFluxo') || 'matriula';
            const paginaAnterior = tipoFluxo === 'rematriula' 
                ? 'tela_enfases.html' 
                : 'tela_enfases.html';
            sessionStorage.setItem('currentStep', 3);
            window.location.href = paginaAnterior;
        });
    }
}

