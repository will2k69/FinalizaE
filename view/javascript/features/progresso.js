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

  if (currentPage === "tela_historico_manual.html") {
    sessionStorage.setItem("origemRevisao", "manual");
  } else if (currentPage === "tela_historico.html") {
    sessionStorage.setItem("origemRevisao", "upload");
  }

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
      description: "Estamos felizes de você começar a sua jornada rumo à sua formação. Esta é a página inicial onde você vai escolher a opção que mais faz sentido para você.",
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
        description: "Faça o upload do seu arquivo de histórico escolar em formato PDF para que o sistema processe seus dados.",
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
        description: "Escolha as ênfases e trilhas do seu interesse para ver o percentual de compatibilidade do seu currículo.",
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

  function updateGuideCard(step, pageName) {
    const titleEl = document.getElementById("guide_title");
    const descEl = document.getElementById("guide_description");
    const iconEl = document.getElementById("guide_icon_text");
    const cardEl = document.getElementById("guide_card");

    if (!titleEl || !descEl || !cardEl) return;

    let currentInstruction = guideInstructions[step];

    if (step === 1) {
      currentInstruction = pageName === "tela_historico_manual.html" ? guideInstructions[1].manual : guideInstructions[1].default;
    } else if (step === 3) {
      currentInstruction = pageName === "tela_materias_conflitos.html" ? guideInstructions[3].conflitos : guideInstructions[3].default;
    }

    if (currentInstruction) {
      titleEl.textContent = currentInstruction.title;
      if (iconEl) iconEl.textContent = currentInstruction.icon;
      typeWriterEffect(descEl, currentInstruction.description);

      cardEl.classList.add("updated");
      setTimeout(() => cardEl.classList.remove("updated"), 300);
    }
  }

  // ==========================================================================
  // 4. ATUALIZAÇÃO DA INTERFACE (UI)
  // ==========================================================================
  function updateUI() {
    // Controla a visibilidade do botão Voltar da barra
    const stepBackContainer = document.getElementById("step_back_container");
    if (stepBackContainer) {
      if (currentStep === 0) {
        stepBackContainer.style.display = "none";
      } else {
        stepBackContainer.style.display = "block";
      }
    }

    // Atualiza classes das bolinhas normais
    steps.forEach((step, index) => {
      step.classList.remove("active", "completed", "disabled");

      if (index < currentStep) {
        step.classList.add("completed");
      } else if (index === currentStep) {
        step.classList.add("active");
      } else if (index === currentStep + 1) {
        // Próxima liberada
      } else {
        step.classList.add("disabled");
      }
    });

    // Linha de progresso
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

    if (currentStep === steps.length - 1) {
      progress_Fill.classList.add("complete");
    } else {
      progress_Fill.classList.remove("complete");
    }

    updateGuideCard(currentStep, currentPage);
  }

  // ==========================================================================
  // 5. EVENT LISTENERS (CLIQUES)
  // ==========================================================================
  
  // Função executada ao clicar em qualquer botão de voltar (Header ou Barra)
  function handleBackAction(e) {
    e.preventDefault();
    const previousPage = getPreviousPageFromCurrentStep();
    
    if (currentPage !== "tela_historico_manual.html" && previousPage !== stepPages.HISTORICO_MANUAL) {
      currentStep = Math.max(0, currentStep - 1);
      saveStep();
      updateUI();
    }
    
    window.location.href = getPagePath(previousPage);
  }

  // Atribui o link e evento ao NOVO botão voltar da barra de progresso
  const btnBackBar = document.getElementById("btn_back_bar");
  if (btnBackBar) {
    btnBackBar.setAttribute("href", getPagePath(getPreviousPageFromCurrentStep()));
    btnBackBar.addEventListener("click", handleBackAction);
  }

  // Mantém suporte ao botão voltar antigo do header caso ele exista na tela
  const backHeaderButton = document.querySelector(".btn-back-header");
  if (backHeaderButton) {
    backHeaderButton.setAttribute("href", getPagePath(getPreviousPageFromCurrentStep()));
    backHeaderButton.addEventListener("click", handleBackAction);
  }

  // Cliques nas logos/home limpam sessão
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

  // Cliques nas bolinhas normais
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

  updateUI();
  window.addEventListener("resize", updateUI);
}