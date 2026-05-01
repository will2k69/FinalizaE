const uploadArea = document.getElementById("upload_Area");
const fileInput = document.getElementById("file_Input");
const fileName = document.getElementById("file_Name");

// volta reseta o progresso para step INICIAL
// TODO: deve ser salvo o estado em que ficou a página para voltar exatamente lá
document.querySelector(".back-link").addEventListener("click", () => {
    sessionStorage.setItem("currentStep", stepOrder.indexOf(stepPages.INICIAL));
});

// Clique na área de upload abre o seletor de arquivo (ignora cliques no label/botão que já abrem nativamente)
uploadArea.addEventListener("click", (e) => {
    if (e.target.tagName === "LABEL" || e.target.closest("label")) return;
    fileInput.click();
});

// Exibe nome do arquivo selecionado
fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.type !== "application/pdf") {
            fileName.textContent = "Por favor, selecione um arquivo PDF.";
            fileName.style.color = "#ef4444";
            uploadArea.classList.remove("has-file");
            fileInput.value = "";
            return;
        }
        fileName.textContent = "Arquivo selecionado: " + file.name;
        fileName.style.color = "#22c55e";
        uploadArea.classList.add("has-file");
    }
});

// Drag and drop
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
        fileName.textContent = "Arquivo selecionado: " + file.name;
        fileName.style.color = "#22c55e";
        uploadArea.classList.add("has-file");
    } else {
        fileName.textContent = "Por favor, selecione um arquivo PDF.";
        fileName.style.color = "#ef4444";
    }
});
