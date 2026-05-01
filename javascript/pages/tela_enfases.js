/**
 * Script para gerenciar a tela de ênfases e parâmetros de planejamento
 */

document.addEventListener('DOMContentLoaded', function() {
    const nextBtn = document.querySelector('.next-btn');
    const hoursSlider = document.getElementById('hoursSlider');
    const enfaseInputs = document.querySelectorAll('input[name="enfase"]');
    const priorityInputs = document.querySelectorAll('input[name="prioridade"]');

    /**
     * Captura a ênfase selecionada
     */
    function getSelectedEnfase() {
        for (const input of enfaseInputs) {
            if (input.checked) {
                const label = input.closest('.card').querySelector('.title-25');
                return label ? label.textContent.trim() : 'Sem ênfase';
            }
        }
        return 'Sem ênfase';
    }

    /**
     * Captura a prioridade selecionada
     */
    function getSelectedPriority() {
        for (const input of priorityInputs) {
            if (input.checked) {
                return input.id === 'p-obrigatorias' ? 'obrigatorias' : 'eletivas';
            }
        }
        return 'obrigatorias';
    }

    /**
     * Handler para o botão "Próximo Passo"
     */
    nextBtn.addEventListener('click', function() {
        // Coletar parâmetros selecionados
        const enfase = getSelectedEnfase();
        const cargaHoraria = parseInt(hoursSlider.value);
        const prioridade = getSelectedPriority();

        // Armazenar em sessionStorage
        sessionStorage.setItem('selectedEnfase', enfase);
        sessionStorage.setItem('cargaHoraria', cargaHoraria);
        sessionStorage.setItem('prioridade', prioridade);

        // Mantém o passo final alinhado com a barra (5 etapas)
        const proximoStep = 4;

        // Avançar para resultado
        sessionStorage.setItem('currentStep', proximoStep);
        window.location.href = 'tela_resultado.html';
    });
});
