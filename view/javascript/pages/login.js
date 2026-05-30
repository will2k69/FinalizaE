const API_URL = `${API_BASE_URL}/auth/login`;

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

function mostrarErro(msg) {
    loginError.textContent = msg;
    loginError.style.display = "block";
}

function esconderErro() {
    loginError.style.display = "none";
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    esconderErro();

    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario,
                senha
            })
        });

        if (!res.ok) {
            mostrarErro("Usuário ou senha inválidos.");
            return;
        }

        const data = await res.json();

        // Salva o token
        localStorage.setItem("admin_token", data.token);

        // Salva o nome do usuário digitado
        localStorage.setItem("admin_usuario", usuario);

        window.location.href = "tela_admin_disciplinas.html";

    } catch (err) {
        console.error(err);

        mostrarErro(
            "Não foi possível conectar ao servidor."
        );
    }
});