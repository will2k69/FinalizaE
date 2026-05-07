/**
 * Componente global de retorno ao topo da página.
 * Exibe um botão flutuante após rolagem mínima e realiza scroll suave ao topo no clique.
 */
(() => {
	const BUTTON_ID = "scrollToTopButton";
	const STYLE_ID = "scrollToTopStyle";
	const SHOW_AFTER_PX = 160;

	// Injeta os estilos do botão apenas uma vez por página.
	function injectStyles() {
		if (document.getElementById(STYLE_ID)) {
			return;
		}

		const style = document.createElement("style");
		style.id = STYLE_ID;
		style.textContent = `
			#${BUTTON_ID} {
				position: fixed;
				right: 20px;
				bottom: 20px;
				width: 52px;
				height: 52px;
				border: none;
				border-radius: 999px;
				background: #5465ff;
				color: #ffffff;
				font-size: 24px;
				line-height: 1;
				display: flex;
				align-items: center;
				justify-content: center;
				cursor: pointer;
				box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
				opacity: 0;
				transform: translateY(20px);
				pointer-events: none;
				transition: opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease;
				z-index: 999;
			}

			#${BUTTON_ID}:hover {
				background: #4354ef;
			}

			#${BUTTON_ID}:focus-visible {
				outline: 3px solid #9ca8ff;
				outline-offset: 2px;
			}

			#${BUTTON_ID}.is-visible {
				opacity: 1;
				transform: translateY(0);
				pointer-events: auto;
			}

			@media (max-width: 600px) {
				#${BUTTON_ID} {
					right: 16px;
					bottom: 16px;
					width: 48px;
					height: 48px;
					font-size: 22px;
				}
			}
		`;

		document.head.appendChild(style);
	}

	// Cria o botão flutuante e registra o comportamento de retorno ao topo.
	function createButton() {
		let button = document.getElementById(BUTTON_ID);

		if (button) {
			return button;
		}

		button = document.createElement("button");
		button.id = BUTTON_ID;
		button.type = "button";
		button.setAttribute("aria-label", "Voltar ao topo");
		button.title = "Voltar ao topo";
		button.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 4l8 10h-6v8h-4v-8H4l8-10z"/></svg>`;

		button.addEventListener("click", () => {
			window.scrollTo({ top: 0, behavior: "smooth" });
		});

		document.body.appendChild(button);
		return button;
	}

	// Exibe ou oculta o botão conforme a posição atual da rolagem.
	function updateVisibility(button) {
		const shouldShow = window.scrollY > SHOW_AFTER_PX;
		button.classList.toggle("is-visible", shouldShow);
	}

	// Inicializa o componente após o carregamento da página.
	function initScrollToTop() {
		if (!document.body) {
			return;
		}

		injectStyles();
		const button = createButton();

		const onScroll = () => updateVisibility(button);
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
	}

	// Garante inicialização segura mesmo em carregamento assíncrono do DOM.
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initScrollToTop);
	} else {
		initScrollToTop();
	}
})();
