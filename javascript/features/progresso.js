    lucide.createIcons();

    const steps = document.querySelectorAll(".step");
    const progress_Fill = document.getElementById("progress_Fill");

    // simulação
    let currentStep = 0;

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

    // CONTROLE DE CLIQUE + BLOQUEIO
    steps.forEach((step, index) => {
      const link = step.querySelector("a");

      link.addEventListener("click", (e) => {
        if (index <= currentStep + 1) {
          currentStep = index;
          updateUI();
        } else {
          e.preventDefault(); // bloqueia pular etapas
        }
      });
    }); 

    updateUI();
