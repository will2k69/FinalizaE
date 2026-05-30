const uploadArea = document.getElementById("upload_Area");
const fileInput = document.getElementById("file_Input");
const fileName = document.getElementById("file_Name");
const extractBtn = document.getElementById("extract_Btn");
const extractStatus = document.getElementById("extract_Status");

const EXTRACT_API_URL = `${API_BASE_URL}/api/extrair-historico`;

/**
 * Atualiza a mensagem de status exibida para o usuário.
 */
function setStatus(message, color) {
    extractStatus.textContent = message;
    extractStatus.style.color = color;
}

/**
 * Habilita ou desabilita o botão de extração conforme a seleção de arquivo.
 */
function updateExtractButtonState() {
    const hasValidFile = fileInput.files.length > 0;
    extractBtn.disabled = !hasValidFile;
}

/**
 * Atualiza o feedback visual da seleção de arquivo.
 */
function updateFileSelectionFeedback(file) {
    if (!file || file.type !== "application/pdf") {
        fileName.textContent = "Por favor, selecione um arquivo PDF.";
        fileName.style.color = "#ef4444";
        uploadArea.classList.remove("has-file");
        setStatus("", "#cfd3ff");
        updateExtractButtonState();
        return;
    }

    fileName.textContent = `Arquivo selecionado: ${file.name}`;
    fileName.style.color = "#22c55e";
    uploadArea.classList.add("has-file");
    setStatus("Arquivo pronto para extração.", "#cfd3ff");
    updateExtractButtonState();
}

/**
 * Envia o PDF para a API, salva o JSON retornado e redireciona para revisão.
 */
async function extrairHistorico() {
    if (fileInput.files.length === 0) {
        setStatus("Selecione um PDF antes de extrair.", "#ef4444");
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    extractBtn.disabled = true;
    extractBtn.textContent = "Extraindo...";
    setStatus("Enviando PDF para extração...", "#cfd3ff");

    try {
        const response = await fetch(EXTRACT_API_URL, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorPayload = await response.json().catch(() => ({}));
            throw new Error(
                errorPayload.detail || "Falha ao extrair dados do histórico."
            );
        }

        const result = await response.json();

        const outputName =
            file.name.replace(/\.pdf$/i, "") + "_finalizae.json";

        const blob = new Blob(
            [JSON.stringify(result, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = outputName;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        sessionStorage.setItem(
            "historicoExtraido",
            JSON.stringify(result)
        );

        setStatus(
            "Extração concluída com sucesso. JSON baixado automaticamente.",
            "#22c55e"
        );

        setTimeout(() => {
            sessionStorage.setItem("currentStep", 2);
            window.location.href = "tela_revisao_historico.html";
        }, 2000);

    } catch (error) {
        setStatus(
            error.message || "Erro inesperado durante a extração.",
            "#ef4444"
        );
    } finally {
        extractBtn.textContent = "Extrair e Exportar JSON";
        updateExtractButtonState();
    }
}

uploadArea.addEventListener("click", (e) => {
    if (
        e.target.tagName === "LABEL" ||
        e.target.closest("label") ||
        e.target.tagName === "BUTTON" ||
        e.target.closest("button")
    ) {
        return;
    }

    fileInput.click();
});

fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];

        if (file.type !== "application/pdf") {
            fileName.textContent = "Por favor, selecione um arquivo PDF.";
            fileName.style.color = "#ef4444";
            uploadArea.classList.remove("has-file");
            fileInput.value = "";
            updateExtractButtonState();
            return;
        }

        updateFileSelectionFeedback(file);
        extrairHistorico();
    }
});

uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");

    const file = e.dataTransfer.files[0];

    if (file && file.type === "application/pdf") {
        fileInput.files = e.dataTransfer.files;
        updateFileSelectionFeedback(file);
        extrairHistorico();
    } else {
        fileName.textContent = "Por favor, selecione um arquivo PDF.";
        fileName.style.color = "#ef4444";
        fileInput.value = "";
        updateExtractButtonState();
    }
});

extractBtn.addEventListener("click", extrairHistorico);

updateExtractButtonState();
