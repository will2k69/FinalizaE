    lucide.createIcons();

    const steps = document.querySelectorAll(".step");
    const progress_Fill = document.getElementById("progress_Fill");

    const stepPages = Object.freeze({
      INICIAL : "tela_inicial.html",
      HISTORICO : "tela_historico.html",
      ANALISE : "tela_materias_conflitos.html",
      REVISÃO : "tela_revisao_historico.html",
    });

    // mapear os índices da progress bar
    const stepOrder = [
      stepPages.INICIAL,
      stepPages.HISTORICO,
      stepPages.ANALISE,
      stepPages.REVISÃO
    ];

    let currentStep = parseInt(sessionStorage.getItem("currentStep")) || 0;

    function saveStep() {
      sessionStorage.setItem("currentStep", currentStep);
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

      const percent = (currentStep / (steps.length - 1)) * 100;
      progress_Fill.style.width = percent + "%";

      if (currentStep === steps.length - 1) {
        progress_Fill.classList.add("complete");
      } else {
        progress_Fill.classList.remove("complete");
      }
    }

    // verifica se dentro de "../pages" para ajustar caminhos relativos
    function getPagePath(page) {
      const path = window.location.pathname;
      if (path.includes("/pages/")) {
        return page;
      }
      return "pages/" + page;
    }

    // clique no logo/ícone reseta o progresso para step 0
    document.querySelectorAll(".top-bar a").forEach((link) => {
      link.addEventListener("click", () => {
        sessionStorage.setItem("currentStep", 0);
      });
    });

    // CONTROLE DE CLIQUE - só permite VOLTAR, não faz sentido avançar pela progress bar
    steps.forEach((step, index) => {
      const link = step.querySelector("a");

      link.addEventListener("click", (e) => {
        e.preventDefault();

        if (index < currentStep) {
          currentStep = index;
          saveStep();
          updateUI();

          // se existe uma página mapeada para esse step, navega
          if (stepOrder[index]) {
            window.location.href = getPagePath(stepOrder[index]);
          }
        }
        // bloqueia avançar pela barra
      });
    });

    updateUI();
