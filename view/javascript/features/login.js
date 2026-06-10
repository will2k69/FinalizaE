document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('formLogin');
    const inputSenha = document.getElementById('fSenha');
    const togglePassword = document.getElementById('togglePassword');
    const loginErrorBox = document.getElementById('loginError');
    const loginErrorMsg = document.getElementById('loginErrorMsg');
    const btnEntrar = document.getElementById('btnEntrar');

    // ==========================================
    // 1. COMPORTAMENTO: Mostrar/Esconder Senha
    // ==========================================
    togglePassword.addEventListener('click', () => {
        // Alterna o tipo do input entre password e text
        const isPassword = inputSenha.type === 'password';
        inputSenha.type = isPassword ? 'text' : 'password';
        
        // Alterna o ícone do FontAwesome
        togglePassword.classList.toggle('fa-eye-slash', !isPassword);
        togglePassword.classList.toggle('fa-eye', isPassword);
    });

    // ==========================================
    // 2. INTEGRAÇÃO: Envio dos dados para a API
    // ==========================================
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede a página de recarregar

        // Limpa estados de erro anteriores
        loginErrorBox.style.display = 'none';
        
        const identity = document.getElementById('fIdentity').value.trim();
        const password = inputSenha.value;

        // Validação básica de campos vazios no front-end
        if (!identity || !password) {
            exibirErro("Por favor, preencha todos os campos.");
            return;
        }

        // Desabilita o botão para evitar cliques duplicados durante a requisição
        btnEntrar.disabled = true;
        const originalBtnHtml = btnEntrar.innerHTML;
        btnEntrar.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Autenticando...`;

        try {
            // Tenta obter a URL base configurada no seu projeto, caso contrário usa o padrão local
            const baseUrl = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://127.0.0.1:8000';
            
            const response = await fetch(`${baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: identity, // Adapte a chave se o seu back-end esperar outra nomenclatura
                    senha: password
                })
            });

            const dados = await response.json();

            if (response.ok) {
                // Sucesso! Guarda o Token JWT enviado pelo back-end no sessionStorage
                // (Mude para localStorage se quiser que o login dure mesmo fechando o navegador)
                sessionStorage.setItem('token_autenticacao', dados.access_token || dados.token);
                sessionStorage.setItem('usuario_logado', JSON.stringify(dados.usuario || { nome: 'Administrador' }));

                // Redireciona para o painel de gerenciamento de disciplinas
                window.location.href = 'tela_admin_disciplinas.html';
            } else {
                // Erro retornado pelo back-end (ex: senha incorreta)
                exibirErro(dados.detail || dados.mensagem || "Credenciais inválidas.");
            }

        } catch (error) {
            console.error("Erro na requisição de login:", error);
            exibirErro("Falha ao conectar com o servidor. Verifique se o back-end está rodando.");
        } finally {
            // Restaura o estado do botão
            btnEntrar.disabled = false;
            btnEntrar.innerHTML = originalBtnHtml;
        }
    });

    // Função auxiliar para injetar mensagens na caixa de erro visual
    function exibirErro(mensagem) {
        loginErrorMsg.textContent = mensagem;
        loginErrorBox.style.display = 'flex';
    }
});