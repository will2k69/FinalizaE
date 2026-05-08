document.addEventListener('DOMContentLoaded', function() {
    // Seletores
    const nextBtn = document.querySelector('.next-btn');
    const backBtn = document.querySelector('.btn-back-header'); // Usando a classe que já existe no seu HTML
    const hoursSlider = document.getElementById('hoursSlider');

    // 1. FORÇAR O BOTÃO VOLTAR
    if (backBtn) {
        // Removemos o href via JS para garantir que o clique execute a função
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

    // 2. LÓGICA DO PRÓXIMO PASSO
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            // Captura de dados (Ênfase)
            const selectedEnfase = document.querySelector('input[name="enfase"]:checked')
                ?.closest('.card').querySelector('.title-25')?.textContent.trim() || 'Sem ênfase';

            // Captura de dados (Prioridade)
            const prioridade = document.querySelector('input[name="prioridade"]:checked')?.id === 'p-obrigatorias' 
                ? 'obrigatorias' 
                : 'eletivas';

            // Salva tudo
            sessionStorage.setItem('selectedEnfase', selectedEnfase);
            sessionStorage.setItem('cargaHoraria', hoursSlider.value);
            sessionStorage.setItem('prioridade', prioridade);
            sessionStorage.setItem('currentStep', 5);

            window.location.href = 'tela_resultado.html';
        });
    }

    // Listener do Slider (Badge)
    if (hoursSlider) {
        const badge = document.getElementById('rangeValue');
        hoursSlider.addEventListener('input', function() {
            if (badge) badge.innerHTML = this.value + 'h / sem';
        });
    }
});