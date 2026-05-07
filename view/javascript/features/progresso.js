    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    const steps = document.querySelectorAll(".step");
    const progress_Fill = document.getElementById("progress_Fill");

    if (steps.length && progress_Fill) {

    const stepPages = Object.freeze({
      INICIAL: "tela_inicial.html",
      HISTORICO: "tela_historico.html",
      REVISAO: "tela_revisao_historico.html",
      ANALISE: "tela_enfases.html",
      RESULTADO: "tela_resultado.html",
    });

    const tipoFluxo = sessionStorage.getItem("tipoFluxo") || "matriula";
    const currentPage = window.location.pathname.split("/").pop() || "";

    function getStepFromCurrentPage(pageName) {
      if (pageName === "tela_inicial.html") return 0;
      if (pageName === "tela_historico.html" || pageName === "tela_historico_manual.html") return 1;
      if (pageName === "tela_revisao_historico.html") return 2;
      if (pageName === "tela_rematricula.html" || pageName === "tela_enfases.html") return 3;
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
          // próxima liberada
        } else {
          step.classList.add("disabled");
        }
      });

      const percent = currentStep > 0 ? (currentStep / (steps.length - 1)) * 100 : 0;
      progress_Fill.style.width = percent + "%";

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
      });
    });

    const backHeaderButton = document.querySelector(".btn-back-header");
    if (backHeaderButton) {
      backHeaderButton.setAttribute("href", getPagePath(getPreviousPageFromCurrentStep()));

      backHeaderButton.addEventListener("click", (e) => {
        e.preventDefault();

        const previousPage = getPreviousPageFromCurrentStep();

        currentStep = Math.max(0, currentStep - 1);
        saveStep();
        updateUI();

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
          if (stepOrder[index]) {
            window.location.href = getPagePath(stepOrder[index]);
          }
        }
      });
    });

    updateUI();
    }
