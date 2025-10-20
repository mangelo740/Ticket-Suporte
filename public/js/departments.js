
// Estado global
let currentDepartments = [];
let currentEditingDepartment = null;

// Elementos DOM
const departmentForm = document.getElementById('departmentForm');
const departmentsList = document.getElementById('departmentsList');
const departmentModal = document.getElementById('departmentModal');
const saveDepartmentBtn = document.getElementById('saveDepartmentBtn');
const cancelDepartmentBtn = document.getElementById('cancelDepartmentBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

// Elementos exclusivos do modal de edição
const editDepartmentName = document.getElementById('editDepartmentName');
const editDepartmentCritico = document.getElementById('editDepartmentCritico');
const editDepartmentAlto = document.getElementById('editDepartmentAlto');
const editDepartmentMedia = document.getElementById('editDepartmentMedia');
const editDepartmentBaixa = document.getElementById('editDepartmentBaixa');

window.addEventListener('DOMContentLoaded', () => {
    loadDepartments();
    if (departmentForm) departmentForm.addEventListener('submit', handleDepartmentSubmit);
    if (saveDepartmentBtn) saveDepartmentBtn.addEventListener('click', handleDepartmentUpdate);
    if (cancelDepartmentBtn) cancelDepartmentBtn.onclick = () => {
        showToast('Edição de departamentos cancelada!');
        closeModal();
        loadDepartments();
    };
    if (closeModalBtn) closeModalBtn.onclick = closeModal;
});

// Carrega departamentos da API
async function loadDepartments() {
    departmentsList.innerHTML = 'Carregando...';
    try {
        const data = await window.ticketDB.getAllDepartments();
        currentDepartments = Array.isArray(data) ? data : [];
        renderDepartmentsList();
    } catch (err) {
        departmentsList.innerHTML = `<div class="ticket-item" style="color:red;">Erro: ${err.message}</div>`;
    }
}

// Renderiza lista de departamentos
function renderDepartmentsList() {
    departmentsList.innerHTML = '';
    if (!currentDepartments || currentDepartments.length === 0) {
        departmentsList.innerHTML = `<div class="ticket-item" style="text-align: center; color: #a1a1aa;"><p>Nenhum departamento cadastrado</p></div>`;
        return;
    }
    currentDepartments.forEach(department => {
        const departmentItem = document.createElement('div');
        departmentItem.className = 'ticket-item';
        departmentItem.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-info">
                    <h3>${department.name}</h3>
                    <p>Cadastrado em: ${formatDate(department.createdAt)}</p>
                    <div style="font-size:0.95em; color:#888; margin-top:0.5em;">
                        Crítico: <b>${department.critico}</b> | Alto: <b>${department.alto}</b> | Média: <b>${department.media}</b> | Baixa: <b>${department.baixa}</b>
                    </div>
                </div>
                <div class="ticket-badges">
                    <button class="edit-btn" data-id="${department.id}"><i class="fas fa-edit"></i> Editar</button>
                    <button class="delete-btn" data-id="${department.id}"><i class="fas fa-trash"></i> Excluir</button>
                </div>
            </div>
        `;
        departmentsList.appendChild(departmentItem);
        departmentItem.querySelector('.edit-btn').addEventListener('click', () => openEditModal(department));
        departmentItem.querySelector('.delete-btn').addEventListener('click', () => confirmDeleteDepartment(department));
    });
}

// Abre modal de edição
function openEditModal(department) {
    currentEditingDepartment = department;
    editDepartmentName.value = department.name || '';
    editDepartmentCritico.value = department.critico || '';
    editDepartmentAlto.value = department.alto || '';
    editDepartmentMedia.value = department.media || '';
    editDepartmentBaixa.value = department.baixa || '';
    departmentModal.style.display = 'block';
    departmentModal.classList.add('active');
}

// Fecha modal
function closeModal() {
    departmentModal.style.display = 'none';
    departmentModal.classList.remove('active');
    currentEditingDepartment = null;
}

// Submete novo departamento
async function handleDepartmentSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('departmentName').value.trim().toUpperCase();
    const critico = Number(document.getElementById('departmentCritico').value);
    const alto = Number(document.getElementById('departmentAlto').value);
    const media = Number(document.getElementById('departmentMedia').value);
    const baixa = Number(document.getElementById('departmentBaixa').value);
    if (!name || critico < 1 || alto < 1 || media < 1 || baixa < 1 || isNaN(critico) || isNaN(alto) || isNaN(media) || isNaN(baixa)) {
        showToast('Preencha todos os campos obrigatórios com valores válidos (maiores que zero)', true);
        return;
    }
    try {
        await window.ticketDB.createDepartment({ name, critico, alto, media, baixa });
        showToast('Departamento cadastrado com sucesso!');
    } catch (error) {
        showToast(`Erro ao cadastrar departamento: ${error.message}`, true);
        console.error('Erro ao cadastrar departamento:', error);
    } finally {
        document.getElementById('departmentName').value = '';
        document.getElementById('departmentCritico').value = '';
        document.getElementById('departmentAlto').value = '';
        document.getElementById('departmentMedia').value = '';
        document.getElementById('departmentBaixa').value = '';
        loadDepartments();
    }
}

// Atualiza departamento
async function handleDepartmentUpdate() {
    if (!currentEditingDepartment) return;
    const name = editDepartmentName.value.trim().toUpperCase();
    const critico = Number(editDepartmentCritico.value);
    const alto = Number(editDepartmentAlto.value);
    const media = Number(editDepartmentMedia.value);
    const baixa = Number(editDepartmentBaixa.value);
    if (!name || critico < 1 || alto < 1 || media < 1 || baixa < 1 || isNaN(critico) || isNaN(alto) || isNaN(media) || isNaN(baixa)) {
        showToast('Preencha todos os campos obrigatórios com valores válidos (maiores que zero)', true);
        return;
    }
    try {
        await window.ticketDB.updateDepartment(currentEditingDepartment.id, { name, critico, alto, media, baixa });
        showToast('Departamento atualizado com sucesso!');
        closeModal();
        loadDepartments();
    } catch (error) {
        showToast(`Erro ao atualizar departamento: ${error.message}`, true);
        console.error('Erro ao atualizar departamento:', error);
    }
}

// Confirma exclusão
function confirmDeleteDepartment(department) {
    if (confirm(`Tem certeza que deseja excluir o departamento ${department.name}?`)) {
        deleteDepartment(department.id);
    }
}

// Exclui departamento
async function deleteDepartment(departmentId) {
    try {
        await window.ticketDB.deleteDepartment(departmentId);
        showToast('Departamento excluído com sucesso!');
        loadDepartments();
    } catch (error) {
        showToast(`Erro ao excluir departamento: ${error.message}`, true);
        console.error('Erro ao excluir departamento:', error);
    }
}

// Formata data
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// Toast
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show';
    if (isError) toast.classList.add('error');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Expor para escopo global
window.closeModal = closeModal;