/**
 * Renderiza a tela final da recomendação a partir do JSON salvo em sessionStorage.
 * Converte a resposta bruta da API em um view model simples para resumo, timeline e pendências.
 */
function classTagPorTipo(tipo) {
    if (tipo === 'obrigatoria') return 'obrigatoria';
    if (tipo === 'eletiva') return 'eletiva';
    return 'pendencia';
}

function labelTipo(tipo, prioridadeEnfase) {
    if (tipo === 'obrigatoria') return 'OBRIGATÓRIA';
    if (prioridadeEnfase) return 'ELETIVA (ÊNFASE)';
    return 'ELETIVA';
}

function indicePeriodo(periodo) {
    const [ano, semestre] = periodo.split('.').map(Number);
    if (!ano || !semestre) return 0;
    return (ano * 2) + (semestre - 1);
}

// Consolida métricas e adapta a resposta da API ao formato consumido pela interface.
function montarViewModel(resultado) {
    const periodos = Array.isArray(resultado.periodos_planejados) ? resultado.periodos_planejados : [];
    const pendencias = Array.isArray(resultado.pendencias) ? resultado.pendencias : [];

    const cargaTotal = periodos.reduce((acc, p) => acc + (p.carga_horaria_total || 0), 0);
    const totalDisciplinas = periodos.reduce((acc, p) => acc + (Array.isArray(p.disciplinas) ? p.disciplinas.length : 0), 0);
    const periodoAtual = resultado.periodo_atual || '2026.1';
    const prazo = resultado.prazo_conclusao || periodoAtual;

    const span = Math.max(1, indicePeriodo(prazo) - indicePeriodo(periodoAtual));
    const meses = span * 6;
    const progresso = Math.max(0, Math.min(100, Math.round((totalDisciplinas / Math.max(1, totalDisciplinas + pendencias.length)) * 100)));

    return {
        progresso,
        tempoRestante: `Planejamento até ${prazo}.`,
        resumo: {
            creditos: Math.round(cargaTotal / 18),
            meses,
            iraEst: pendencias.length === 0 ? 'Sem pendências críticas' : `${pendencias.length} pendência(s)`
        },
        planejamento: periodos.map((p, index) => ({
            semestre: p.periodo,
            ordem: String(index + 1).padStart(2, '0'),
            statusCarga: `${p.carga_horaria_total}h`,
            tipoCarga: p.carga_horaria_total >= 420 ? 'highlight-high' : 'highlight',
            disciplinas: (p.disciplinas || []).map((d) => ({
                nome: `${d.codigo} - ${d.nome}`,
                horas: `${d.carga_horaria}h`,
                tipo: classTagPorTipo(d.tipo),
                tag: labelTipo(d.tipo, d.prioridade_enfase),
                info: (d.prerequisitos_pendentes && d.prerequisitos_pendentes.length > 0)
                    ? `Pré-requisitos pendentes: ${d.prerequisitos_pendentes.join(', ')}`
                    : '',
                icon: 'fa-circle-info',
            }))
        })),
        pendencias,
        bruto: resultado,
    };
}

// Monta visualmente o resumo da recomendação, os semestres planejados e as pendências.
function renderizarDashboard(data) {
    document.getElementById('display-percent').innerText = `${data.progresso}%`;
    document.getElementById('display-tempo-restante').innerText = data.tempoRestante;
    document.getElementById('resumo-creditos').innerText = data.resumo.creditos;
    document.getElementById('resumo-tempo').innerText = `${data.resumo.meses} meses`;
    document.getElementById('resumo-ira').innerText = data.resumo.iraEst;

    const progressBar = document.getElementById('progress-fill-results');
    setTimeout(() => { progressBar.style.width = `${data.progresso}%`; }, 300);

    const container = document.getElementById('timeline-container');
    container.innerHTML = '';

    data.planejamento.forEach((sem) => {
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
                ${sem.disciplinas.map((disc) => `
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

    if (data.pendencias.length > 0) {
        const pendencias = document.createElement('div');
        pendencias.className = 'semester-group';
        pendencias.innerHTML = `
            <div class="semester-title">
                <span class="badge-number">!</span>
                <div>
                    <h3>Pendências até o prazo</h3>
                    <p>Disciplinas não alocadas automaticamente</p>
                </div>
            </div>
            <div class="cards-grid">
                ${data.pendencias.map((p) => `
                    <div class="card-subject">
                        <div class="card-tag pendencia">
                            PENDÊNCIA
                        </div>
                        <h4>${p.codigo} - ${p.nome}</h4>
                        <div class="card-info warning">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <span>${p.motivo}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(pendencias);
    }
}

function setupAcoes(dadosBrutos) {
    document.getElementById('btn-pdf').addEventListener('click', () => window.print());

    document.getElementById('btn-json').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(dadosBrutos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recomendacao_finalizae.json';
        a.click();
        URL.revokeObjectURL(url);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const raw = sessionStorage.getItem('recomendacaoResultado');
    if (!raw) {
        document.getElementById('timeline-container').innerHTML =
            '<p style="color: var(--text-sec);">Nenhuma recomendação encontrada. Volte para a tela de ênfases e gere novamente.</p>';
        setupAcoes({});
        return;
    }

    let resultado;
    try {
        resultado = JSON.parse(raw);
    } catch (_) {
        document.getElementById('timeline-container').innerHTML =
            '<p style="color: var(--text-sec);">Falha ao ler resultado da recomendação.</p>';
        setupAcoes({});
        return;
    }

    const viewModel = montarViewModel(resultado);
    renderizarDashboard(viewModel);
    setupAcoes(resultado);
});

