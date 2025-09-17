// Global state
let currentDepartments = [];
let currentEditingDepartment = null;

// DOM Elements
const departmentForm = document.getElementById('departmentForm');
const departmentsList = document.getElementById('departmentsList');
const departmentModal = document.getElementById('departmentModal');
const editDepartmentName = document.getElementById('editDepartmentName');
const saveDepartmentBtn = document.getElementById('saveDepartmentBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadDepartments();
    setupEventListeners();
    // Botões de fechar/cancelar do modal
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelDepartmentBtn = document.getElementById('cancelDepartmentBtn');
    if (closeModalBtn) closeModalBtn.onclick = closeModal;
        {
            style.display = 'none';
            style.classList.remove('active');
        }
    if (cancelDepartmentBtn) cancelDepartmentBtn.onclick = closeModal;
});

// Setup event listeners
function setupEventListeners() {
    if (departmentForm) {
        departmentForm.addEventListener('submit', handleDepartmentSubmit);
    }
    if (saveDepartmentBtn) {
        saveDepartmentBtn.addEventListener('click', handleDepartmentUpdate);
    }
}

// Load departments from API
async function loadDepartments() {
    const departmentsList = document.getElementById('departmentsList');
    departmentsList.innerHTML = 'Carregando...';
    try {
        const localIp = window.location.hostname;
        const url = `http://${localIp}:3001/api/departments`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Erro ao buscar departamentos');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            departmentsList.innerHTML = '';
            data.forEach(dep => {
                const item = document.createElement('div');
                item.className = 'ticket-item';
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.justifyContent = 'space-between';
                item.style.gap = '2rem';
                item.innerHTML = `
                    <div style="display:flex; align-items:center; gap:2rem; flex:1; flex-wrap:wrap;">
                        <h3 style="margin:0 1rem 0 0;">${dep.name}</h3>
                        <span><strong>Crítico:</strong> ${dep.critico ?? '-'} min</span>
                        <span><strong>Alto:</strong> ${dep.alto ?? '-'} min</span>
                        <span><strong>Média:</strong> ${dep.media ?? '-'} min</span>
                        <span><strong>Baixa:</strong> ${dep.baixa ?? '-'} min</span>
                    </div>
                    <div class="ticket-badges" style="display:flex; gap:0.5rem;">
                        <button class="edit-btn" data-id="${dep.id}" data-name="${dep.name}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="delete-btn" data-id="${dep.id}">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                `;
                // Adiciona eventos aos botões
                item.querySelector('.edit-btn').onclick = function() {
                    openEditModal({
                        id: dep.id,
                        name: dep.name,
                        critico: dep.critico,
                        alto: dep.alto,
                        media: dep.media,
                        baixa: dep.baixa
                    });
                };
                item.querySelector('.delete-btn').onclick = function() {
                    confirmDeleteDepartment({ id: dep.id, name: dep.name });
                };
                departmentsList.appendChild(item);
            });
        } else {
            departmentsList.innerHTML = `<div class="ticket-item" style="text-align: center; color: #a1a1aa;"><p>Nenhum departamento cadastrado</p></div>`;
        }
// Estado global
let currentEditingDepartment = null;

// Elementos DOM
const departmentForm = document.getElementById('departmentForm');
const departmentsList = document.getElementById('departmentsList');
const departmentModal = document.getElementById('departmentModal');
const editDepartmentName = document.getElementById('editDepartmentName');
const editDepartmentCritico = document.getElementById('departmentCritico');
const editDepartmentAlto = document.getElementById('departmentAlto');
const editDepartmentMedia = document.getElementById('departmentMedia');
const editDepartmentBaixa = document.getElementById('departmentBaixa');
const saveDepartmentBtn = document.getElementById('saveDepartmentBtn');
const cancelDepartmentBtn = document.getElementById('cancelDepartmentBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
    loadDepartments();
    if (departmentForm) departmentForm.addEventListener('submit', handleDepartmentSubmit);
    if (saveDepartmentBtn) saveDepartmentBtn.addEventListener('click', handleDepartmentUpdate);
    if (cancelDepartmentBtn) cancelDepartmentBtn.addEventListener('click', () => {
        showToast('Edição de departamentos cancelada!');
        closeModal();
    });
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
});

// Carrega departamentos da API
async function loadDepartments() {
    departmentsList.innerHTML = 'Carregando...';
    try {
        const data = await window.ticketDB.getAllDepartments();
        if (Array.isArray(data) && data.length > 0) {
            departmentsList.innerHTML = '';
            data.forEach(dep => {
                const item = document.createElement('div');
                item.className = 'ticket-item';
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.justifyContent = 'space-between';
                item.style.gap = '2rem';
                item.innerHTML = `
                    <div style="display:flex; align-items:center; gap:2rem; flex:1; flex-wrap:wrap;">
                        <h3 style="margin:0 1rem 0 0;">${dep.name}</h3>
                        <span><strong>Crítico:</strong> ${dep.critico ?? '-'} min</span>
                        <span><strong>Alto:</strong> ${dep.alto ?? '-'} min</span>
                        <span><strong>Média:</strong> ${dep.media ?? '-'} min</span>
                        <span><strong>Baixa:</strong> ${dep.baixa ?? '-'} min</span>
                    </div>
                    <div class="ticket-badges" style="display:flex; gap:0.5rem;">
                        <button class="edit-btn" data-id="${dep.id}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="delete-btn" data-id="${dep.id}">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                `;
                // Eventos dos botões
                item.querySelector('.edit-btn').onclick = function() {
                    openEditModal(dep);
                };
                item.querySelector('.delete-btn').onclick = function() {
                    confirmDeleteDepartment(dep);
                };
                departmentsList.appendChild(item);
            });
        } else {
            departmentsList.innerHTML = `<div class="ticket-item" style="text-align: center; color: #a1a1aa;"><p>Nenhum departamento cadastrado</p></div>`;
        }
    } catch (err) {
        departmentsList.innerHTML = `<div class="ticket-item" style="color:red;">Erro: ${err.message}</div>`;
    }
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
    const critico = parseInt(document.getElementById('departmentCritico').value) || 0;
    const alto = parseInt(document.getElementById('departmentAlto').value) || 0;
    const media = parseInt(document.getElementById('departmentMedia').value) || 0;
    const baixa = parseInt(document.getElementById('departmentBaixa').value) || 0;
    if (!name) {
        showToast('Preencha o nome do departamento', true);
        return;
    }
    try {
        await window.ticketDB.createDepartment({ name, critico, alto, media, baixa });
        showToast('Departamento cadastrado com sucesso!');
        departmentForm.reset();
        loadDepartments();
    } catch (error) {
        showToast(`Erro ao cadastrar departamento: ${error.message}`, true);
    }
}

// Atualiza departamento
async function handleDepartmentUpdate() {
    if (!currentEditingDepartment) return;
    const name = editDepartmentName.value.trim().toUpperCase();
    const critico = parseInt(editDepartmentCritico.value) || 0;
    const alto = parseInt(editDepartmentAlto.value) || 0;
    const media = parseInt(editDepartmentMedia.value) || 0;
    const baixa = parseInt(editDepartmentBaixa.value) || 0;
    if (!name) {
        showToast('Preencha o nome do departamento', true);
        return;
    }
    try {
        await window.ticketDB.updateDepartment(currentEditingDepartment.id, { name, critico, alto, media, baixa });
        showToast('Departamento atualizado com sucesso!');
        closeModal();
        loadDepartments();
    } catch (error) {
        showToast(`Erro ao atualizar departamento: ${error.message}`, true);
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

window.closeModal = closeModal;
    } catch (err) {
        departmentsList.innerHTML = `<div class="ticket-item" style="color:red;">Erro: ${err.message}</div>`;
    }
}

// Render departments list
function renderDepartmentsList() {
    if (!departmentsList) return;

    departmentsList.innerHTML = '';

    if (currentDepartments.length === 0) {
        departmentsList.innerHTML = `
            <div class="ticket-item" style="text-align: center; color: #a1a1aa;">
                <p>Nenhum departamento  cadastrado</p>
            </div>
        `;
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
                </div>
                <div class="ticket-badges">
                    <button class="edit-btn" data-id="${department.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="delete-btn" data-id="${department.id}">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `;

        departmentsList.appendChild(departmentItem);

        // Add event listeners to buttons
        const editBtn = departmentItem.querySelector('.edit-btn');
        const deleteBtn = departmentItem.querySelector('.delete-btn');

        editBtn.addEventListener('click', () => openEditModal(department));
        deleteBtn.addEventListener('click', () => confirmDeleteDepartment(department));
    });
}

// Handle department form submission
async function handleDepartmentSubmit(e) {
    e.preventDefault();

    const nameInput = document.getElementById('departmentName');
    const criticoInput = document.getElementById('departmentCritico');
    const altoInput = document.getElementById('departmentAlto');
    const mediaInput = document.getElementById('departmentMedia');
    const baixaInput = document.getElementById('departmentBaixa');

    const departmentData = {
        name: nameInput.value.trim().toUpperCase(),
        critico: parseInt(criticoInput.value),
        alto: parseInt(altoInput.value),
        media: parseInt(mediaInput.value),
        baixa: parseInt(baixaInput.value)
    };

    try {
        const result = await window.ticketDB.createDepartment(departmentData);
        showToast('Departamento cadastrado com sucesso!');
    } catch (error) {
        showToast(`Erro ao cadastrar departamento: ${error.message}`, true);
        console.error('Erro ao cadastrar departamento:', error);
    } finally {
        // Reset form and reload departments
        nameInput.value = '';
        criticoInput.value = '';
        altoInput.value = '';
        mediaInput.value = '';
        baixaInput.value = '';
        loadDepartments();
    }
}

// Close modal edition department
document.getElementById('cancelDepartmentBtn').onclick = async function() {
    showToast('Edição de departamentos cancelada!');
    closeModal();
    loadDepartments();
}

// Close modal
function closeModal() {
    departmentModal.classList.remove('active');
    currentEditingDepartment = null;
}

// Handle department update
async function handleDepartmentUpdate() {
    if (!currentEditingDepartment) return;

    const editDepartmentName = document.getElementById('editDepartmentName');
    const editDepartmentArea = document.getElementById('editDepartmentArea');

    const departmentData = {
        name: editDepartmentName.value.trim().toUpperCase(),
        area: editDepartmentArea.value.trim()
    };

    if (!departmentData.name || !departmentData.area) {
        showToast('Preencha todos os campos obrigatórios', true);
        return;
    }
    
    try {
        await window.ticketDB.updateDepartment(currentEditingDepartment.id, departmentData);
        showToast('Departamento atualizado com sucesso!');
        closeModal();
        loadDepartments();
    } catch (error) {
        showToast(`Erro ao atualizar departamento: ${error.message}`, true);
        console.error('Erro ao atualizar departamento:', error);
    }
}

// Confirm delete department
function confirmDeleteDepartment(department) {
    if (confirm(`Tem certeza que deseja excluir o departamento ${department.name}?`)) {
        deleteDepartment(department.id);
    }
}

// Delete department
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

// Helper: Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    // Format: DD/MM/YYYY HH:MM
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// Show toast notification
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

// Expose to global scope
window.closeModal = closeModal;