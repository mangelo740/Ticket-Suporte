// Global state
let currentUsers = [];
let currentEditingUser = null;

// DOM Elements
const userForm = document.getElementById('userForm');
const usersList = document.getElementById('usersList');
const userModal = document.getElementById('userModal');
const editUserName = document.getElementById('editUserName');
const editUserArea = document.getElementById('editUserArea');
const saveUserBtn = document.getElementById('saveUserBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    userForm.addEventListener('submit', handleUserSubmit);
    saveUserBtn.addEventListener('click', handleUserUpdate);
}

// Load users from API
async function loadUsers() {
    try {
        const users = await window.ticketDB.getAllUsers();
        currentUsers = users;
        renderUsersList();
    } catch (error) {
        showToast(`Erro ao carregar usuários: ${error.message}`, true);
        console.error('Erro ao carregar usuários:', error);
    }
}

// Render users list
function renderUsersList() {
    if (!usersList) return;
    
    usersList.innerHTML = '';
    
    if (currentUsers.length === 0) {
        usersList.innerHTML = `
            <div class="ticket-item" style="text-align: center; color: #a1a1aa;">
                <p>Nenhum usuário cadastrado</p>
            </div>
        `;
        return;
    }
    
    currentUsers.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'ticket-item';
        userItem.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-info">
                    <h3>${user.name}</h3>
                    <p>${user.area}</p>
                    <p>Cadastrado em: ${formatDate(user.createdAt)}</p>
                </div>
                <div class="ticket-badges">
                    <button class="edit-user-btn" data-id="${user.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="delete-user-btn" data-id="${user.id}">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `;
        
        usersList.appendChild(userItem);
        
        // Add event listeners to buttons
        const editBtn = userItem.querySelector('.edit-user-btn');
        const deleteBtn = userItem.querySelector('.delete-user-btn');
        
        editBtn.addEventListener('click', () => openEditModal(user));
        deleteBtn.addEventListener('click', () => confirmDeleteUser(user));
    });
}

// Handle user form submission
async function handleUserSubmit(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('userName');
    const areaInput = document.getElementById('userArea');
    
    const userData = {
        name: nameInput.value.trim(),
        area: areaInput.value.trim()
    };
    
    if (!userData.name || !userData.area) {
        showToast('Preencha todos os campos obrigatórios', true);
        return;
    }
    
    try {
        const result = await window.ticketDB.createUser(userData);
        showToast('Usuário cadastrado com sucesso!');
        
        // Reset form and reload users
        nameInput.value = '';
        areaInput.value = '';
        loadUsers();
    } catch (error) {
        showToast(`Erro ao cadastrar usuário: ${error.message}`, true);
        console.error('Erro ao cadastrar usuário:', error);
    }
}

// Open edit modal
function openEditModal(user) {
    currentEditingUser = user;
    editUserName.value = user.name;
    editUserArea.value = user.area;
    
    userModal.classList.add('active');
}

// Close modal
function closeModal() {
    userModal.classList.remove('active');
    currentEditingUser = null;
}

// Handle user update
async function handleUserUpdate() {
    if (!currentEditingUser) return;
    
    const userData = {
        name: editUserName.value.trim(),
        area: editUserArea.value.trim()
    };
    
    if (!userData.name || !userData.area) {
        showToast('Preencha todos os campos obrigatórios', true);
        return;
    }
    
    try {
        await window.ticketDB.updateUser(currentEditingUser.id, userData);
        showToast('Usuário atualizado com sucesso!');
        closeModal();
        loadUsers();
    } catch (error) {
        showToast(`Erro ao atualizar usuário: ${error.message}`, true);
        console.error('Erro ao atualizar usuário:', error);
    }
}

// Confirm delete user
function confirmDeleteUser(user) {
    if (confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
        deleteUser(user.id);
    }
}

// Delete user
async function deleteUser(userId) {
    try {
        await window.ticketDB.deleteUser(userId);
        showToast('Usuário excluído com sucesso!');
        loadUsers();
    } catch (error) {
        showToast(`Erro ao excluir usuário: ${error.message}`, true);
        console.error('Erro ao excluir usuário:', error);
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