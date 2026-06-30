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

// Monta visualmente o resumo da recomendação, os semestres planejados e as pendências na tela.
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

// Configura as ações dos botões, incluindo o gerador de relatório limpo e customizado para impressão.
function setupAcoes(dadosBrutos) {
    document.getElementById('btn-pdf').addEventListener('click', () => {
        try {
            const data = montarViewModel(dadosBrutos);

            // Cria uma janela em memória para renderização isolada do relatório A4 limpo
            const janelaImpressao = window.open('', '_blank', 'width=900,height=700');
            if (!janelaImpressao) {
                window.alert('Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-up do navegador.');
                return;
            }

            const htmlRelatorio = `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Recomendação Acadêmica - Finalizaê</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
                @page {
                    size: A4;
                    margin: 20mm 15mm;
                }
                body {
                    font-family: 'Poppins', Arial, sans-serif;
                    color: #1e293b;
                    background: #ffffff;
                    font-size: 10pt;
                    line-height: 1.5;
                    margin: 0; padding: 0;
                }
                .header-container { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 25px; }
                .header-table { width: 100%; border-collapse: collapse; }
                .title-area h1 { font-size: 20pt; color: #1e40af; margin: 0 0 5px 0; font-weight: 700; }
                .title-area p { font-size: 9pt; color: #64748b; margin: 0; }
                .meta-area { text-align: right; font-size: 9pt; color: #475569; line-height: 1.4; }
                
                .dashboard-table { width: 100%; border-collapse: separate; border-spacing: 12px 0; margin: 0 -12px 25px -12px; }
                .dashboard-cell { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; width: 33.33%; vertical-align: top; }
                .dashboard-cell .label { font-size: 8pt; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 5px; display: block; }
                .dashboard-cell .value { font-size: 15pt; font-weight: 700; color: #0f172a; }
                .dashboard-cell .subtext { font-size: 8pt; color: #64748b; margin-top: 4px; }

                h2 { font-size: 13pt; color: #1e40af; border-left: 4px solid #3b82f6; padding-left: 8px; margin: 30px 0 15px 0; page-break-after: avoid; }
                .semester-block { margin-bottom: 25px; page-break-inside: avoid; }
                .semester-header { background-color: #f1f5f9; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; }
                .semester-header table { width: 100%; border-collapse: collapse; }
                .semester-title { font-size: 11pt; font-weight: 700; color: #1e293b; }
                .semester-charge { text-align: right; font-size: 10pt; font-weight: 600; color: #b45309; }
                
                .disciplines-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                .disciplines-table th { background-color: #f8fafc; color: #64748b; font-size: 8.5pt; font-weight: 600; text-transform: uppercase; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
                .disciplines-table td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 9.5pt; vertical-align: top; }
                
                .tag { display: inline-block; font-size: 7.5pt; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
                .tag-obrigatoria { background-color: #ffedd5; color: #ea580c; }
                .tag-eletiva { background-color: #e0f2fe; color: #0369a1; }
                .tag-pendencia { background-color: #fee2e2; color: #dc2626; }
                
                .info-alert { font-size: 8.5pt; color: #b45309; background-color: #fffbeb; border: 1px solid #fde68a; padding: 6px 10px; border-radius: 4px; margin-top: 6px; }
                .notes-section { margin-top: 40px; padding: 15px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; page-break-inside: avoid; }
                .notes-section h3 { margin: 0 0 8px 0; font-size: 10pt; color: #0f172a; }
                .notes-section p { margin: 0; font-size: 9pt; color: #475569; line-height: 1.4; }
            </style>
        </head>
        <body>
            <div class="header-container">
                <table class="header-table">
                    <tr>
                        <td class="title-area">
                            <h1>Relatório de Orientação Acadêmica</h1>
                            <p>Plano de Integralização Curricular Otimizado</p>
                        </td>
                        <td class="meta-area">
                            <strong>Sistema:</strong> Finalizaê<br>
                            <strong>Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}<br>
                            <strong>Status:</strong> Otimizado
                        </td>
                    </tr>
                </table>
            </div>

            <table class="dashboard-table">
                <tr>
                    <td class="dashboard-cell">
                        <span class="label">Progresso do Curso</span>
                        <span class="value">${data.progresso}%</span>
                        <div class="subtext">Porcentagem de disciplinas previstas alocadas.</div>
                    </td>
                    <td class="dashboard-cell">
                        <span class="label">Créditos Restantes</span>
                        <span class="value">${data.resumo.creditos} <span style="font-size: 10pt; font-weight: normal; color: #64748b;">créditos</span></span>
                        <div class="subtext">Calculado com base na carga total restante.</div>
                    </td>
                    <td class="dashboard-cell">
                        <span class="label">Tempo Estimado</span>
                        <span class="value">${data.resumo.meses} <span style="font-size: 10pt; font-weight: normal; color: #64748b;">meses</span></span>
                        <div class="subtext">${data.tempoRestante}</div>
                    </td>
                </tr>
            </table>

            <h2>Cronograma de Matrícula Sugerido</h2>

            ${data.planejamento.map((sem) => `
                <div class="semester-block">
                    <div class="semester-header">
                        <table>
                            <tr>
                                <td class="semester-title">Período Planejado: Semestre ${sem.semestre}</td>
                                <td class="semester-charge">Carga Horária: ${sem.statusCarga}</td>
                            </tr>
                        </table>
                    </div>
                    <table class="disciplines-table">
                        <thead>
                            <tr>
                                <th style="width: 20%;">Código</th>
                                <th style="width: 65%;">Nome da Disciplina</th>
                                <th style="width: 15%;">Tipo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sem.disciplinas.map((disc) => {
                                const partes = disc.nome.split(' - ');
                                const codigo = partes[0] || '';
                                const nomeReal = partes.slice(1).join(' - ') || disc.nome;
                                return `
                                <tr>
                                    <td><strong>${codigo}</strong></td>
                                    <td>
                                        ${nomeReal}
                                        ${disc.info ? `<div class="info-alert">${disc.info}</div>` : ''}
                                    </td>
                                    <td><span class="tag tag-${disc.tipo}">${disc.tag}</span></td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('')}

            ${data.pendencias.length > 0 ? `
                <h2>Pendências Identificadas</h2>
                <div class="semester-block">
                    <table class="disciplines-table">
                        <thead>
                            <tr>
                                <th style="width: 20%;">Código</th>
                                <th style="width: 40%;">Disciplina</th>
                                <th style="width: 40%;">Motivo da Não Alocação</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.pendencias.map((p) => `
                                <tr>
                                    <td><strong style="color: #dc2626;">${p.codigo}</strong></td>
                                    <td>${p.nome}</td>
                                    <td style="color: #475569; font-size: 9pt;">${p.motivo}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}

            <div class="notes-section">
                <h3>Considerações Importantes</h3>
                <p>Este plano foi gerado de forma algorítmica pelo sistema <strong>Finalizaê</strong> baseando-se em regras de pré-requisitos e fluxogramas acadêmicos. A efetivação da matrícula depende da oferta real de vagas e turmas pela coordenação do seu curso.</p>
            </div>
        </body>
        </html>
        `;

            janelaImpressao.document.write(htmlRelatorio);
            janelaImpressao.document.close();
            janelaImpressao.focus();

            // Timeout para carregar fontes externas antes do print
            setTimeout(() => {
                janelaImpressao.print();
                janelaImpressao.close();
            }, 500);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            window.alert('Falha ao gerar o relatório PDF. Tente novamente.');
        }
    });

    // Mantém a exportação de arquivo JSON intacta
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