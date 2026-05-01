
function toggleMenu() {
      document.getElementById("menu").classList.toggle("active");
      document.getElementById("navRight").classList.toggle("active");
    }

// Garante que ao carregar a tela inicial, o step seja 0
sessionStorage.setItem("currentStep", 0);

// Ao clicar em Matrícula ou Rematrícula, avança para step 1 (HISTORICO)
document.querySelectorAll(".card .btn").forEach((btn) => {
    if (btn.getAttribute("href") === stepPages.HISTORICO) {
        btn.addEventListener("click", () => {
            sessionStorage.setItem("currentStep", stepOrder.indexOf(stepPages.HISTORICO));
        });
    }
});

