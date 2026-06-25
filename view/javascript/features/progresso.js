// ==========================================================================
// 1. INICIALIZAÇÃO DE ÍCONES (LUCIDE)
// ==========================================================================
if (typeof lucide !== "undefined") {
  lucide.createIcons();
}

const steps = document.querySelectorAll(".step");
const progress_Fill = document.getElementById("progress_Fill");

if (steps.length && progress_Fill) {

  // ==========================================================================
  // 2. CONFIGURAÇÕES E MAPEAMENTO DE PÁGINAS
  // ==========================================================================
  const stepPages = Object.freeze({
    INICIAL: "tela_inicial.html",
    HISTORICO: "tela_historico.html",
    HISTORICO_MANUAL: "tela_historico_manual.html",
    REVISAO: "tela_revisao_historico.html",
    ANALISE: "tela_enfases.html",
    RESULTADO: "tela_resultado.html",
  });

  const tipoFluxo = sessionStorage.getItem("tipoFluxo") || "matricula";
  const currentPage = window.location.pathname.split("/").pop() || "";

  // Salva o histórico de navegação para a tela de revisão
  if (currentPage === "tela_historico_manual.html") {
    sessionStorage.setItem("origemRevisao", "manual");
  } else if (currentPage === "tela_historico.html") {
    sessionStorage.setItem("origemRevisao", "upload");
  }

  // Retorna o índice correto baseado nas bolinhas existentes no HTML (0 a 4)
  function getStepFromCurrentPage(pageName) {
    if (pageName === "tela_inicial.html") return 0;
    if (pageName === "tela_historico.html" || pageName === "tela_historico_manual.html") return 1;
    if (pageName === "tela_revisao_historico.html") return 2;
    if (pageName === "tela_materias_conflitos.html" || pageName === "tela_enfases.html") return 3;
    if (pageName === "tela_resultado.html") return 4;

    const saved = parseInt(sessionStorage.getItem("currentStep"), 10);
    return Number.isNaN(saved) ? 0 : saved;
  }

  let currentStep = getStepFromCurrentPage(currentPage);
  sessionStorage.setItem("currentStep", currentStep);

  function saveStep() {
    sessionStorage.setItem("currentStep", currentStep);
  }

  function getStepOrder() {
    return [
      stepPages.INICIAL,
      stepPages.HISTORICO,
      stepPages.REVISAO,
      stepPages.ANALISE,
      stepPages.RESULTADO,
    ];
  }

  // Define qual é a página anterior de forma inteligente
  function getPreviousPageFromCurrentStep() {
    if (currentPage === "tela_historico_manual.html") {
      return stepPages.HISTORICO;
    }
    
    if (currentPage === "tela_revisao_historico.html" && sessionStorage.getItem("origemRevisao") === "manual") {
      return stepPages.HISTORICO_MANUAL;
    }
    
    const stepOrder = getStepOrder();
    const previousIndex = Math.max(0, currentStep - 1);
    return stepOrder[previousIndex] || stepPages.INICIAL;
  }

  function getPagePath(page) {
    const path = window.location.pathname;
    if (path.includes("/pages/")) {
      return page;
    }
    return "pages/" + page;
  }

  // ==========================================================================
  // 3. TEXTOS DO GUIA INFORMATIVO E EFEITO DE DIGITAÇÃO
  // ==========================================================================
  const guideInstructions = {
    0: {
      title: "Bem-vindo ao Finalizâe! 🚀",
      description: "Estamos felizes de você começar a sua jornada rumo à sua formação. Esta é a página inicial escolha seu curso e a opção de matrícula para iniciar sua jornada de formação",
      icon: "👋"
    },
    1: {
      manual: {
        title: "Preenchimento do Histórico",
        description: "Insira manualmente as disciplinas que você já cursou e suas respectivas menções/notas nos campos indicados.",
        icon: "✍️"
      },
      default: {
        title: "Envio de Histórico",
        description: "Faça o upload do seu arquivo de histórico retirado do SIGAA em formato PDF para que o sistema processe seus dados.",
        icon: "📁"
      }
    },
    2: {
      title: "Revisão dos Dados",
      description: "Confira se todas as matérias extraídas e notas estão corretas. Caso note erros, você pode editar antes de prosseguir.",
      icon: "🔍"
    },
    3: {
      conflitos: {
        title: "Análise de Conflitos",
        description: "Atenção! Verifique as matérias com conflito de horários ou pendências detectadas antes de fechar sua grade.",
        icon: "⚠️"
      },
      default: {
        title: "Seleção de Ênfases",
        description: "não vi necessidade, é autoexplicativo toda a tela",
        icon: "📊"
      }
    },
    4: {
      title: "Resultado da Análise",
      description: "Tudo pronto! Veja abaixo as recomendações de matrícula personalizadas para o seu próximo semestre.",
      icon: "🎉"
    }
  };

  let typingTimer = null;

  // Função que simula o efeito de máquina de escrever
  function typeWriterEffect(element, text, speed = 20) {
    if (typingTimer) clearTimeout(typingTimer);
    
    element.textContent = "";
    let index = 0;

    function type() {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
        typingTimer = setTimeout(type, speed);
      }
    }
    
    type();
  }

  // Atualiza dinamicamente o card de guia baseado na tela e step
  function updateGuideCard(step, pageName) {
    const titleEl = document.getElementById("guide_title");
    const descEl = document.getElementById("guide_description");
    const iconEl = document.getElementById("guide_icon_text");
    const cardEl = document.getElementById("guide_card");

    if (!titleEl || !descEl || !cardEl) return;

    let currentInstruction = guideInstructions[step];

    // Tratamento de sub-páginas específicas
    if (step === 1) {
      currentInstruction = pageName === "tela_historico_manual.html" ? guideInstructions[1].manual : guideInstructions[1].default;
    } else if (step === 3) {
      currentInstruction = pageName === "tela_materias_conflitos.html" ? guideInstructions[3].conflitos : guideInstructions[3].default;
    }

    if (currentInstruction) {
      titleEl.textContent = currentInstruction.title;
      if (iconEl) iconEl.textContent = currentInstruction.icon;

      // Executa o efeito de digitação no texto descritivo
      typeWriterEffect(descEl, currentInstruction.description);

      // Animação de transição do container
      cardEl.classList.add("updated");
      setTimeout(() => cardEl.classList.remove("updated"), 300);
    }
  }

  // ==========================================================================
  // 4. ATUALIZAÇÃO DA INTERFACE (UI)
  // ==========================================================================
  function updateUI() {
    // Atualiza classes das bolinhas (Steps)
    steps.forEach((step, index) => {
      step.classList.remove("active", "completed", "disabled");

      if (index < currentStep) {
        step.classList.add("completed");
      } else if (index === currentStep) {
        step.classList.add("active");
      } else if (index === currentStep + 1) {
        // Próxima liberada, sem classe restritiva
      } else {
        step.classList.add("disabled");
      }
    });

    // Atualiza o preenchimento da linha de progresso
    if (currentStep === 0) {
      progress_Fill.style.width = "0%";
    } else {
      const firstCircle = steps[0].querySelector(".circle");
      const currentCircle = steps[currentStep].querySelector(".circle");
      const container = document.querySelector(".progress-container");

      if (firstCircle && currentCircle && container) {
        const firstRect = firstCircle.getBoundingClientRect();
        const currentRect = currentCircle.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const startX = (firstRect.left + firstRect.width / 2) - containerRect.left;
        const endX = (currentRect.left + currentRect.width / 2) - containerRect.left;

        const fillWidth = endX - startX;
        
        progress_Fill.style.left = `${startX}px`;
        progress_Fill.style.width = `${fillWidth}px`;
      }
    }

    // Cor verde final se chegar no último passo
    if (currentStep === steps.length - 1) {
      progress_Fill.classList.add("complete");
    } else {
      progress_Fill.classList.remove("complete");
    }

    // DISPARA A ATUALIZAÇÃO DO CARD DO GUIA COM EFEITO DE TEXTO
    updateGuideCard(currentStep, currentPage);
  }

  // ==========================================================================
  // 5. EVENT LISTENERS (CLIQUES E EVENTOS)
  // ==========================================================================
  
  // Limpeza de fluxo ao clicar na logo/home
  document.querySelectorAll(".top-bar a").forEach((link) => {
    link.addEventListener("click", () => {
      sessionStorage.setItem("currentStep", 0);
      sessionStorage.removeItem("tipoFluxo");
      sessionStorage.removeItem("historicoExtraido");
      sessionStorage.removeItem("historicoManual");
      sessionStorage.removeItem("disciplinasComConflito");
      sessionStorage.removeItem("origemRevisao");
    });
  });

  // Controle do Botão Voltar do Header
  const backHeaderButton = document.querySelector(".btn-back-header");
  if (backHeaderButton) {
    backHeaderButton.setAttribute("href", getPagePath(getPreviousPageFromCurrentStep()));

    backHeaderButton.addEventListener("click", (e) => {
      e.preventDefault();
      const previousPage = getPreviousPageFromCurrentStep();
      
      if (currentPage !== "tela_historico_manual.html" && previousPage !== stepPages.HISTORICO_MANUAL) {
        currentStep = Math.max(0, currentStep - 1);
        saveStep();
        updateUI();
      }
      
      window.location.href = getPagePath(previousPage);
    });
  }

  // Clique nas bolinhas do progresso (Apenas passos anteriores)
  steps.forEach((step, index) => {
    const link = step.querySelector("a");
    if (!link) return;

    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (index < currentStep) {
        currentStep = index;
        saveStep();
        updateUI();
        const stepOrder = getStepOrder();
        
        if (index === 1 && sessionStorage.getItem("origemRevisao") === "manual") {
          window.location.href = getPagePath(stepPages.HISTORICO_MANUAL);
        } else if (stepOrder[index]) {
          window.location.href = getPagePath(stepOrder[index]);
        }
      }
    });
  });

  // Executa ao carregar e monitora redimensionamento da tela
  updateUI();
  window.addEventListener("resize", updateUI);
}