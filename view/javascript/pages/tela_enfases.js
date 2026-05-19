/**
 * Script para gerenciar a tela de ênfases e parâmetros de planejamento
 */
document.addEventListener('DOMContentLoaded', function() {
    // === 1. SELETORES DE ELEMENTOS ===
    const nextBtn = document.querySelector('.next-btn');
    const backBtn = document.querySelector('.btn-back-header'); 
    const hoursSlider = document.getElementById('hoursSlider');
    const rangeValue = document.getElementById('rangeValue'); // Badge de horas
    const enfaseInputs = document.querySelectorAll('input[name="enfase"]');

    // === 2. RESTAURAR ESTADO SALVO (Garante a persistência dos dados ao voltar/atualizar) ===
    function restoreState() {
        // Restaurar Ênfase
        const savedEnfase = sessionStorage.getItem('selectedEnfase');
        if (savedEnfase && enfaseInputs.length > 0) {
            enfaseInputs.forEach(input => {
                const label = input.closest('.card')?.querySelector('.title-25');
                if (label && label.textContent.trim() === savedEnfase) {
                    input.checked = true;
                }
            });
        }

        // Restaurar Carga Horária
        const savedCarga = sessionStorage.getItem('cargaHoraria');
        if (savedCarga && hoursSlider) {
            hoursSlider.value = savedCarga;
            if (rangeValue) rangeValue.innerHTML = savedCarga + 'h / sem';
        }

        // Restaurar Prioridade
        const savedPriority = sessionStorage.getItem('prioridade');
        if (savedPriority) {
            const priorityInput = document.getElementById(`p-${savedPriority}`);
            if (priorityInput) priorityInput.checked = true;
        }
    }

    // Executa a restauração assim que a página carrega
    restoreState();

    // === 3. LOGICA DO BOTÃO VOLTAR (Navegação condicional baseada no fluxo) ===
    if (backBtn) {
        // Removemos o href via JS para garantir que o clique execute a função personalizada
        backBtn.removeAttribute('href');
        backBtn.style.cursor = 'pointer';

        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Pegamos o fluxo e limpamos espaços ou letras maiúsculas
            const fluxo = (sessionStorage.getItem('tipoFluxo') || '').toLowerCase().trim();
            
            // Se for rematrícula (tratando o erro de digitação 'rematriula' ou o correto)
            if (fluxo.includes('remat')) {
                window.location.href = 'tela_materias_conflitos.html';
            } else {
                window.location.href = 'tela_revisao_historico.html';
            }
        });
    }

    // === 4. LÓGICA DO PRÓXIMO PASSO (Salvar e Avançar) ===
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            // Captura de dados (Ênfase) de forma segura
            const selectedEnfase = document.querySelector('input[name="enfase"]:checked')
                ?.closest('.card')?.querySelector('.title-25')?.textContent.trim() || 'Sem ênfase';

            // Captura de dados (Prioridade)
            const prioridade = document.querySelector('input[name="prioridade"]:checked')?.id === 'p-obrigatorias' 
                ? 'obrigatorias' 
                : 'eletivas';

            // Salva as escolhas atuais na sessão
            sessionStorage.setItem('selectedEnfase', selectedEnfase);
            if (hoursSlider) sessionStorage.setItem('cargaHoraria', hoursSlider.value);
            sessionStorage.setItem('prioridade', prioridade);
            
            // Define o passo atual (Passo 4 ou 5 dependendo da sua regra de negócio)
            sessionStorage.setItem('currentStep', 4); 

            // Redireciona para o resultado
            window.location.href = 'tela_resultado.html';
        });
    }

    // === 5. ESCUTADOR DO SLIDER (Atualiza o Badge em tempo real) ===
    if (hoursSlider) {
        hoursSlider.addEventListener('input', function() {
            if (rangeValue) rangeValue.innerHTML = this.value + 'h / sem';
        });
    }
});
