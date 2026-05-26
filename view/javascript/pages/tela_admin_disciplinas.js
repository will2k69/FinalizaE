/**
 * Script da tela admin de disciplinas.
 * Este arquivo está ficando grande, talvez seja interessante dividir em módulos (ex: api.js para chamadas à API, ui.js para manipulação do DOM, etc).
 * mas por hora, deixei tudo junto.
 * TODO: refatorar e documentar melhor as funções.
 */

const API_URL = `${API_BASE_URL}/api/disciplinas/`;

// --- Estado ---
let disciplinas = [];
let editingId = null;

// --- Refs DOM ---
const tabelaBody    = document.getElementById('tabelaDisciplinas');
const modalOverlay  = document.getElementById('modalOverlay');
const modalTitulo   = document.getElementById('modalTitulo');
const form          = document.getElementById('formDisciplina');
const adminError    = document.getElementById('adminError');
const adminErrorMsg = document.getElementById('adminErrorMsg');
const toastEl       = document.getElementById('toast');

// --- Utilitários ---

function showToast(msg, tipo = 'success') {
    toastEl.textContent = msg;
    toastEl.className = `toast ${tipo} show`;
    setTimeout(() => { toastEl.className = 'toast'; }, 3500);
}

function showApiError(msg) {
    adminErrorMsg.textContent = msg;
    adminError.style.display = 'flex';
}

function hideApiError() {
    adminError.style.display = 'none';
}

const TIPO_LABEL = {
    obrigatoria: 'Obrigatória',
    eletiva:     'Eletiva',
    outros:      'Outros',
};

const TURNO_LABEL = { M: 'Manhã', T: 'Tarde' };

// --- Renderização da tabela ---

function renderTabela() {
    if (disciplinas.length === 0) {
        tabelaBody.innerHTML =
            '<tr class="empty-row"><td colspan="7">Nenhuma disciplina cadastrada.</td></tr>';
        return;
    }

    tabelaBody.innerHTML = disciplinas.map(d => `
        <tr>
            <td><code>${escHtml(d.codigo)}</code></td>
            <td>${escHtml(d.nome)}</td>
            <td>${d.carga_horaria}h</td>
            <td><span class="badge-tipo badge-${d.tipo}">${TIPO_LABEL[d.tipo] ?? d.tipo}</span></td>
            <td>${TURNO_LABEL[d.turno] ?? d.turno}</td>
            <td>${d.periodo_ideal}º</td>
            <td>
                <button class="btn-icon btn-icon-edit"  title="Editar"  onclick="abrirModalEditar(${d.id_disciplina})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-icon btn-icon-delete" title="Excluir" onclick="confirmarExcluir(${d.id_disciplina}, '${escHtml(d.nome)}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/** Escapa caracteres HTML para evitar XSS nos dados vindos da API. */
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// --- Chamadas à API ---

async function carregarDisciplinas() {
    tabelaBody.innerHTML =
        '<tr class="loading-row"><td colspan="7"><i class="fa-solid fa-circle-notch fa-spin"></i> Carregando...</td></tr>';
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        disciplinas = await res.json();
        hideApiError();
        renderTabela();
    } catch (err) {
        showApiError(`Não foi possível carregar as disciplinas. Verifique se a API está em execução. (${err.message})`);
        tabelaBody.innerHTML =
            '<tr class="error-row"><td colspan="7"><i class="fa-solid fa-triangle-exclamation"></i> Falha ao carregar dados.</td></tr>';
    }
}

async function criarDisciplina(payload) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
    }
    return res.json();
}

async function atualizarDisciplina(id, payload) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
    }
    return res.json();
}

async function excluirDisciplina(id) {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
    }
}

// --- Modal ---

function preencherForm(disc = null) {
    form.querySelector('#fCodigo').value       = disc?.codigo        ?? '';
    form.querySelector('#fNome').value         = disc?.nome          ?? '';
    form.querySelector('#fCargaHoraria').value = disc?.carga_horaria ?? '';
    form.querySelector('#fTipo').value         = disc?.tipo          ?? '';
    form.querySelector('#fTurno').value        = disc?.turno         ?? '';
    form.querySelector('#fPeriodo').value      = disc?.periodo_ideal ?? '';

    // Limpa erros anteriores
    form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

function abrirModalNova() {
    editingId = null;
    modalTitulo.textContent = 'Nova Disciplina';
    preencherForm(null);
    modalOverlay.style.display = 'flex';
    form.querySelector('#fCodigo').focus();
}

function abrirModalEditar(id) {
    const disc = disciplinas.find(d => d.id_disciplina === id);
    if (!disc) return;
    editingId = id;
    modalTitulo.textContent = 'Editar Disciplina';
    preencherForm(disc);
    modalOverlay.style.display = 'flex';
    form.querySelector('#fNome').focus();
}

function fecharModal() {
    modalOverlay.style.display = 'none';
    editingId = null;
}

// --- Validação simples ---

function validarForm() {
    let valido = true;
    const campos = ['fCodigo', 'fNome', 'fCargaHoraria', 'fTipo', 'fTurno', 'fPeriodo'];
    campos.forEach(id => {
        const el = form.querySelector(`#${id}`);
        if (!el.value.trim()) {
            el.classList.add('input-error');
            valido = false;
        } else {
            el.classList.remove('input-error');
        }
    });
    return valido;
}

// --- Submit do form ---

async function onSubmit(e) {
    e.preventDefault();
    if (!validarForm()) {
        showToast('Preencha todos os campos obrigatórios.', 'error');
        return;
    }

    const payload = {
        codigo:        form.querySelector('#fCodigo').value.trim().toUpperCase(),
        nome:          form.querySelector('#fNome').value.trim(),
        carga_horaria: parseInt(form.querySelector('#fCargaHoraria').value),
        tipo:          form.querySelector('#fTipo').value,
        turno:         form.querySelector('#fTurno').value,
        periodo_ideal: parseInt(form.querySelector('#fPeriodo').value),
    };

    const btnSalvar = form.querySelector('#btnSalvar');
    btnSalvar.disabled = true;
    btnSalvar.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...';

    try {
        if (editingId === null) {
            await criarDisciplina(payload);
            showToast('Disciplina cadastrada com sucesso!');
        } else {
            await atualizarDisciplina(editingId, payload);
            showToast('Disciplina atualizada com sucesso!');
        }
        fecharModal();
        await carregarDisciplinas();
    } catch (err) {
        showToast(`Erro: ${err.message}`, 'error');
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar';
    }
}

// --- Exclusão ---

async function confirmarExcluir(id, nome) {
    if (!window.confirm(`Deseja excluir permanentemente a disciplina:\n"${nome}"?`)) return;
    try {
        await excluirDisciplina(id);
        showToast('Disciplina excluída.');
        await carregarDisciplinas();
    } catch (err) {
        showToast(`Erro ao excluir: ${err.message}`, 'error');
    }
}

// --- Event Listeners ---

document.getElementById('btnNova').addEventListener('click', abrirModalNova);
document.getElementById('btnCancelar').addEventListener('click', fecharModal);
document.getElementById('btnFecharModal').addEventListener('click', fecharModal);
form.addEventListener('submit', onSubmit);

// Fechar modal ao clicar fora
modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay) fecharModal();
});

// Fechar modal com Esc
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modalOverlay.style.display === 'flex') fecharModal();
});

// --- Inicialização ---
carregarDisciplinas();
