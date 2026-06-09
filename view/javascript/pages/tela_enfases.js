/**
 * Controla a tela de parâmetros da recomendação.
 *
 * Responsabilidades principais:
 * - restaurar escolhas salvas do usuário;
 * - inferir período atual a partir do histórico revisado;
 * - consultar a API para descobrir a carga mínima viável;
 * - enviar o payload final para geração da recomendação.
 */
document.addEventListener('DOMContentLoaded', function () {
    const nextBtn = document.querySelector('.next-btn');
    const backBtn = document.querySelector('.btn-back-header');
    const hoursSlider = document.getElementById('hoursSlider');
    const rangeValue = document.getElementById('rangeValue');
    const enfaseInputs = document.querySelectorAll('input[name="enfase"]');
    const periodoAtualInput = document.getElementById('periodoAtualInput');
    const prazoConclusaoInput = document.getElementById('prazoConclusaoInput');
    const sliderMinLabel = document.getElementById('sliderMinLabel');

    const baseUrl = typeof API_BASE_URL !== 'undefined'
        ? API_BASE_URL
        : (['localhost', '127.0.0.1'].includes(window.location.hostname)
            ? 'http://localhost:8000'
            : 'https://finalizae.onrender.com');

    const RECOMENDACAO_API_URL = `${baseUrl}/api/recomendacoes/gerar`;
    const CARGA_MINIMA_API_URL = `${baseUrl}/api/recomendacoes/carga-minima`;
    let cargaMinimaCalculada = 72;

    function atualizarBadgeCarga() {
        if (rangeValue && hoursSlider) {
            rangeValue.innerHTML = `${hoursSlider.value}h / período`;
        }
    }

    function aplicarMinimoSlider(minimo) {
        if (!hoursSlider) return;
        const min = Math.max(72, Math.min(576, Number(minimo) || 72));
        cargaMinimaCalculada = min;
        hoursSlider.min = String(min);
        if (Number(hoursSlider.value) < min) {
            hoursSlider.value = String(min);
        }
        if (sliderMinLabel) {
            sliderMinLabel.textContent = `${min}h (Mínimo)`;
        }
        atualizarBadgeCarga();
    }

    function restoreState() {
        const savedEnfase = sessionStorage.getItem('selectedEnfase');
        if (savedEnfase && enfaseInputs.length > 0) {
            enfaseInputs.forEach((input) => {
                const label = input.closest('.card')?.querySelector('.title-25');
                if (label && label.textContent.trim() === savedEnfase) {
                    input.checked = true;
                }
            });
        }

        const savedCarga = sessionStorage.getItem('cargaHoraria');
        if (savedCarga && hoursSlider) {
            hoursSlider.value = savedCarga;
            atualizarBadgeCarga();
        }

        const savedPriority = sessionStorage.getItem('prioridade');
        if (savedPriority) {
            const priorityInput = document.getElementById(`p-${savedPriority}`);
            if (priorityInput) priorityInput.checked = true;
        }

        const savedPeriodoAtual = sessionStorage.getItem('periodoAtual') || formatarPeriodoAtual();
        const sugeridoPeloHistorico = sugerirPeriodoAtualPeloHistorico();
        if (periodoAtualInput) {
            periodoAtualInput.value = sugeridoPeloHistorico || savedPeriodoAtual;
        }

        const savedPrazo = sessionStorage.getItem('prazoConclusao') || '';
        if (prazoConclusaoInput) {
            prazoConclusaoInput.value = savedPrazo;
        }
    }

    function formatarPeriodoAtual() {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const semestre = (hoje.getMonth() + 1) <= 6 ? 1 : 2;
        return `${ano}.${semestre}`;
    }

    function validarPeriodo(value) {
        return /^\d{4}\.[12]$/.test(String(value || '').trim());
    }

    function periodoParaIndice(periodo) {
        if (!validarPeriodo(periodo)) {
            return null;
        }
        const ano = Number(String(periodo).slice(0, 4));
        const semestre = Number(String(periodo).slice(5));
        return (ano * 2) + (semestre - 1);
    }

    function indiceParaPeriodo(indice) {
        const ano = Math.floor(indice / 2);
        const semestre = (indice % 2) + 1;
        return `${ano}.${semestre}`;
    }

    function sugerirPeriodoAtualPeloHistorico() {
        const raw = sessionStorage.getItem('historicoRevisado') || sessionStorage.getItem('historicoExtraido');
        if (!raw) {
            return null;
        }

        try {
            const parsed = JSON.parse(raw);
            const linhas = Array.isArray(parsed)
                ? parsed
                : (Array.isArray(parsed.disciplinas) ? parsed.disciplinas : []);

            let maiorIdxCursando = null;
            let maiorIdxConcluida = null;

            for (const item of linhas) {
                const periodo = String(item.ano_periodo_letivo || item.periodo || '').trim();
                const idx = periodoParaIndice(periodo);
                if (idx === null) {
                    continue;
                }

                const situacao = String(item.situacao || item.status || '').toUpperCase();
                if (situacao.includes('MATRIC') || situacao.includes('CURS')) {
                    if (maiorIdxCursando === null || idx > maiorIdxCursando) {
                        maiorIdxCursando = idx;
                    }
                } else {
                    if (maiorIdxConcluida === null || idx > maiorIdxConcluida) {
                        maiorIdxConcluida = idx;
                    }
                }
            }

            if (maiorIdxCursando !== null) {
                return indiceParaPeriodo(maiorIdxCursando);
            }

            if (maiorIdxConcluida !== null) {
                return indiceParaPeriodo(maiorIdxConcluida + 1);
            }

            return null;
        } catch (_) {
            return null;
        }
    }

    function mapearEnfase(valorUi) {
        const normalizado = (valorUi || '').trim().toLowerCase();
        const mapa = {
            'computação visual': 'computacao_visual',
            'sistemas inteligentes': 'sistemas_inteligentes',
            'sistemas de computação': 'sistemas_computacao',
            'sistemas de informação': 'sistemas_informacao',
            'sem ênfase': 'computacao_visual',
        };
        return mapa[normalizado] || 'computacao_visual';
    }

    // Normaliza o histórico salvo em sessionStorage para o contrato esperado pela API.
    function extrairHistoricoParaRecomendacao() {
        const raw = sessionStorage.getItem('historicoRevisado') || sessionStorage.getItem('historicoExtraido');
        if (!raw) {
            return [];
        }

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (_) {
            return [];
        }

        const linhas = Array.isArray(parsed)
            ? parsed
            : (Array.isArray(parsed.disciplinas) ? parsed.disciplinas : []);

        return linhas
            .map((item) => {
                const codigo = String(item.codigo_disciplina || item.codigo || '').trim().toUpperCase();
                const situacao = String(item.situacao || item.status || '').trim().toUpperCase();
                const mediaRaw = String(item.media ?? item.nota ?? '').trim().replace(',', '.');
                const nota = Number.parseFloat(mediaRaw);

                if (!codigo) {
                    return null;
                }

                const status = (situacao.includes('MATRIC') || situacao.includes('CURS'))
                    ? 'cursando'
                    : 'concluida';

                return {
                    codigo,
                    nota: Number.isFinite(nota) ? nota : 0.0,
                    status,
                };
            })
            .filter(Boolean);
    }

    // Recalcula o piso do slider conforme prazo, ênfase, prioridade e histórico.
    async function atualizarCargaMinimaViavel() {
        const selectedEnfase = document.querySelector('input[name="enfase"]:checked')
            ?.closest('.card')?.querySelector('.title-25')?.textContent.trim() || 'Sem ênfase';
        const periodoAtual = String(periodoAtualInput?.value || '').trim();
        const prazoConclusao = String(prazoConclusaoInput?.value || '').trim();

        if (!validarPeriodo(periodoAtual) || !validarPeriodo(prazoConclusao)) {
            return;
        }

        const historico = extrairHistoricoParaRecomendacao();
        const semEnfase = selectedEnfase.toLowerCase() === 'sem ênfase';
        const prioridade = document.querySelector('input[name="prioridade"]:checked')?.id === 'p-obrigatorias'
            ? 'obrigatorias'
            : 'eletivas';

        const payload = {
            enfase: mapearEnfase(selectedEnfase),
            periodo_atual: periodoAtual,
            prazo_conclusao: prazoConclusao,
            carga_horaria_max_por_periodo: 576,
            prioridade,
            minimo_eletivas_enfase: semEnfase ? 0 : 5,
            historico,
        };

        try {
            const response = await fetch(CARGA_MINIMA_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                return;
            }

            const data = await response.json();
            aplicarMinimoSlider(data.carga_minima_por_periodo);
        } catch (_) {
            // Em caso de falha de rede/API, mantém limites padrão.
        }
    }

    restoreState();
    aplicarMinimoSlider(cargaMinimaCalculada);

    if (backBtn) {
        backBtn.removeAttribute('href');
        backBtn.style.cursor = 'pointer';
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const fluxo = (sessionStorage.getItem('tipoFluxo') || '').toLowerCase().trim();
            if (fluxo.includes('remat')) {
                window.location.href = 'tela_materias_conflitos.html';
                return;
            }
            window.location.href = 'tela_revisao_historico.html';
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', async function () {
            const selectedEnfase = document.querySelector('input[name="enfase"]:checked')
                ?.closest('.card')?.querySelector('.title-25')?.textContent.trim() || 'Sem ênfase';

            const prioridade = document.querySelector('input[name="prioridade"]:checked')?.id === 'p-obrigatorias'
                ? 'obrigatorias'
                : 'eletivas';

            const periodoAtual = String(periodoAtualInput?.value || '').trim();
            const prazoConclusao = String(prazoConclusaoInput?.value || '').trim();

            if (!validarPeriodo(periodoAtual)) {
                window.alert('Período atual inválido. Use o formato AAAA.S, por exemplo 2026.1.');
                return;
            }

            if (!validarPeriodo(prazoConclusao)) {
                window.alert('Prazo inválido. Use o formato AAAA.S, por exemplo 2028.1.');
                return;
            }

            const indiceAtual = periodoParaIndice(periodoAtual);
            const indicePrazo = periodoParaIndice(prazoConclusao);
            if (indiceAtual === null || indicePrazo === null || indiceAtual >= indicePrazo) {
                window.alert('O prazo de conclusão precisa ser posterior ao período atual.');
                return;
            }

            const historico = extrairHistoricoParaRecomendacao();
            if (!historico.length) {
                window.alert('Nenhum histórico revisado encontrado. Volte para a revisão do histórico antes de gerar a recomendação.');
                return;
            }

            const cargaSemestral = hoursSlider ? Number(hoursSlider.value) : cargaMinimaCalculada;

            if (cargaSemestral < cargaMinimaCalculada) {
                window.alert(`A carga máxima por período deve ser de pelo menos ${cargaMinimaCalculada}h para viabilizar a conclusão no prazo.`);
                return;
            }

            const semEnfase = selectedEnfase.toLowerCase() === 'sem ênfase';

            const payload = {
                enfase: mapearEnfase(selectedEnfase),
                periodo_atual: periodoAtual,
                prazo_conclusao: prazoConclusao,
                carga_horaria_max_por_periodo: cargaSemestral,
                prioridade,
                minimo_eletivas_enfase: semEnfase ? 0 : 5,
                historico,
            };

            sessionStorage.setItem('selectedEnfase', selectedEnfase);
            sessionStorage.setItem('cargaHoraria', String(cargaSemestral));
            sessionStorage.setItem('prioridade', prioridade);
            sessionStorage.setItem('periodoAtual', periodoAtual);
            sessionStorage.setItem('prazoConclusao', prazoConclusao);

            nextBtn.disabled = true;
            nextBtn.textContent = 'Gerando recomendação...';

            try {
                const response = await fetch(RECOMENDACAO_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorPayload = await response.json().catch(() => ({}));
                    throw new Error(errorPayload.detail || 'Falha ao gerar recomendação.');
                }

                const resultado = await response.json();
                sessionStorage.setItem('recomendacaoResultado', JSON.stringify(resultado));
                sessionStorage.setItem('currentStep', 4);
                window.location.href = 'tela_resultado.html';
            } catch (error) {
                window.alert(error.message || 'Erro inesperado ao gerar recomendação.');
            } finally {
                nextBtn.disabled = false;
                nextBtn.textContent = 'Próximo Passo ➔';
            }
        });
    }

    if (hoursSlider) {
        hoursSlider.addEventListener('input', function () {
            if (Number(this.value) < cargaMinimaCalculada) {
                this.value = String(cargaMinimaCalculada);
            }
            atualizarBadgeCarga();
        });
    }

    if (periodoAtualInput) {
        periodoAtualInput.addEventListener('blur', atualizarCargaMinimaViavel);
    }

    if (prazoConclusaoInput) {
        prazoConclusaoInput.addEventListener('blur', atualizarCargaMinimaViavel);
    }

    enfaseInputs.forEach((input) => {
        input.addEventListener('change', atualizarCargaMinimaViavel);
    });

    document.querySelectorAll('input[name="prioridade"]').forEach((input) => {
        input.addEventListener('change', atualizarCargaMinimaViavel);
    });

    atualizarCargaMinimaViavel();
});
