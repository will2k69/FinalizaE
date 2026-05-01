
function toggleMenu() {
      document.getElementById("menu").classList.toggle("active");
      document.getElementById("navRight").classList.toggle("active");
    }

// Garante que ao carregar a tela inicial, o step seja 0
sessionStorage.setItem("currentStep", 0);

// Ao clicar em Matrícula ou Rematrícula (com classe flow-btn), armazena o tipo de fluxo
document.querySelectorAll(".flow-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
        const tipoFluxo = btn.getAttribute("data-flow");
        sessionStorage.setItem("tipoFluxo", tipoFluxo);
        sessionStorage.setItem("currentStep", 1); // Avança para step 1
    });
});

// Garante que ao clicar em "Explorar Planejamento", o curso selecionado seja passado para a próxima tela (ou CC por padrão, caso nenhum seja selecionado)
const courseSelectHome = document.getElementById("courseSelectHome");
const explorePlanningBtn = document.getElementById("explorePlanningBtn");

if (explorePlanningBtn && courseSelectHome) {
    explorePlanningBtn.addEventListener("click", (event) => {
        event.preventDefault();

        const selectedCourse = courseSelectHome.value;
        const hasValidCourse = Boolean(selectedCourse);
        const targetUrl = hasValidCourse
            ? `tela_explorar_planejamento.html?curso=${encodeURIComponent(selectedCourse)}`
            : "tela_explorar_planejamento.html";

        window.location.href = targetUrl;
    });
}

