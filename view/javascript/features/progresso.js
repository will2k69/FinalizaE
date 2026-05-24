if (typeof lucide !== "undefined") {
  lucide.createIcons();
}

const steps = document.querySelectorAll(".step");
const progress_Fill = document.getElementById("progress_Fill");

if (steps.length && progress_Fill) {

  const stepPages = Object.freeze({
    INICIAL: "tela_inicial.html",
    HISTORICO: "tela_historico.html",
    HISTORICO_MANUAL: "tela_historico_manual.html", // Adicionado para consistência
    REVISAO: "tela_revisao_historico.html",
    ANALISE: "tela_enfases.html",
    RESULTADO: "tela_resultado.html",
  });

  const tipoFluxo = sessionStorage.getItem("tipoFluxo") || "matriula";
  const currentPage = window.location.pathname.split("/").pop() || "";

  // Se estamos na tela manual, salvamos que a revisão deve voltar para ela
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
    // Caso 1: Se estou na tela manual, a anterior obrigatoriamente é a tela de upload de histórico
    if (currentPage === "tela_historico_manual.html") {
      return stepPages.HISTORICO;
    }
    
    // Caso 2: Se estou na tela de revisão e vim da manual, a anterior deve ser a manual
    if (currentPage === "tela_revisao_historico.html" && sessionStorage.getItem("origemRevisao") === "manual") {
      return stepPages.HISTORICO_MANUAL;
    }
    
    const stepOrder = getStepOrder();
    const previousIndex = Math.max(0, currentStep - 1);
    return stepOrder[previousIndex] || stepPages.INICIAL;
  }

  function updateUI() {
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
  }

  function getPagePath(page) {
    const path = window.location.pathname;
    if (path.includes("/pages/")) {
      return page;
    }
    return "pages/" + page;
  }

  document.querySelectorAll(".top-bar a").forEach((link) => {
    link.addEventListener("click", () => {
      sessionStorage.setItem("currentStep", 0);
      sessionStorage.removeItem("tipoFluxo");
      sessionStorage.removeItem("historicoExtraido");
      sessionStorage.removeItem("historicoManual");
      sessionStorage.removeItem("disciplinasComConflito");
      sessionStorage.removeItem("origemRevisao"); // Limpa ao voltar pro início
    });
  });

  // ==========================================================================
  // CONTROLE DO BOTÃO VOLTAR REVISADO
  // ==========================================================================
  const backHeaderButton = document.querySelector(".btn-back-header");
  if (backHeaderButton) {
    backHeaderButton.setAttribute("href", getPagePath(getPreviousPageFromCurrentStep()));

    backHeaderButton.addEventListener("click", (e) => {
      e.preventDefault();
      const previousPage = getPreviousPageFromCurrentStep();
      
      // Só diminui o passo do progresso geral se não estiver mudando entre sub-telas do mesmo Step
      if (currentPage !== "tela_historico_manual.html" && previousPage !== stepPages.HISTORICO_MANUAL) {
        currentStep = Math.max(0, currentStep - 1);
        saveStep();
        updateUI();
      }
      
      window.location.href = getPagePath(previousPage);
    });
  }

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
        
        // Se clicar na bolinha "Enviar Histórico" vindo da Revisão, decide para onde vai com base na origem
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
