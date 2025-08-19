// Painel administrativo - exibe e gerencia tickets do banco

document.addEventListener('DOMContentLoaded', function() {
    setupTabs();
    setupFilters();
    loadTickets();
});

let currentTickets = [];
let selectedTicket = null;

// Tabs
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.querySelector(`.tab-btn[onclick="showTab('${tabId}')"]`);
    if (btn) btn.classList.add('active');
    if (tabId === 'dashboard') renderDashboard();
    if (tabId === 'stats') renderStats();
}

function setupTabs() {
    showTab('dashboard');
}

// Filtros
function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    if (searchInput) searchInput.addEventListener('input', filterTickets);
    if (statusFilter) statusFilter.addEventListener('change', filterTickets);
    if (priorityFilter) priorityFilter.addEventListener('change', filterTickets);
}

// Carregar todos os tickets do banco
async function loadTickets() {
    try {
        currentTickets = (await window.ticketDB.getAllTickets()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        renderDashboard();
        renderRecentTickets();
        renderTickets(currentTickets);
        renderStats();
        window.checkDbStatus();
    } catch {
        showToast('Erro ao carregar tickets', 'error');
        window.checkDbStatus();
    }
}

// Renderizar lista de tickets (aba Tickets)
function renderTickets(tickets) {
    const ticketsList = document.getElementById('ticketsList');
    if (!ticketsList) return;
    ticketsList.innerHTML = '';

    if (!tickets || tickets.length === 0) {
        ticketsList.innerHTML = '<p style="padding: 1.5rem; text-align: center; color: #6b7280;">Nenhum ticket encontrado</p>';
        return;
    }

    tickets.forEach(ticket => {
        const ticketDiv = document.createElement('div');
        ticketDiv.className = 'ticket-item';
        ticketDiv.onclick = () => openTicketModal(ticket);

        const createdDate = new Date(ticket.createdAt).toLocaleDateString('pt-BR');
        const createdTime = new Date(ticket.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        ticketDiv.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-info">
                    <h3>${ticket.ticketNumber}</h3>
                    <p><strong>${ticket.firstName} ${ticket.lastName}</strong> - ${ticket.department}</p>
                    <p>${ticket.destinationArea}</p>
                    <p style="color: #9ca3af; font-size: 0.75rem;">${createdDate} às ${createdTime}</p>
                </div>
                <div class="ticket-badges">
                    <span class="badge status-${(ticket.status || '').toLowerCase().replace(' ', '-')}">${ticket.status}</span>
                    <span class="badge priority-${(ticket.priority || '').toLowerCase()}">${ticket.priority}</span>
                </div>
            </div>
            <p style="color: #4b5563; margin-top: 0.5rem;">${ticket.description ? ticket.description.substring(0, 100) : ''}${ticket.description && ticket.description.length > 100 ? '...' : ''}</p>
        `;
        ticketsList.appendChild(ticketDiv);
    });
}

// Filtro de tickets
function filterTickets() {
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const status = document.getElementById('statusFilter')?.value || 'all';
    const priority = document.getElementById('priorityFilter')?.value || 'all';

    let filtered = currentTickets.filter(ticket => {
        let matchSearch = (
            (ticket.ticketNumber || '').toString().includes(search) ||
            (ticket.firstName || '').toLowerCase().includes(search) ||
            (ticket.lastName || '').toLowerCase().includes(search) ||
            (ticket.subject || '').toLowerCase().includes(search) ||
            (ticket.description || '').toLowerCase().includes(search)
        );
        let matchStatus = (status === 'all' || ticket.status === status);
        let matchPriority = (priority === 'all' || ticket.priority === priority);
        return matchSearch && matchStatus && matchPriority;
    });

    renderTickets(filtered);
}

// Dashboard - estatísticas
function renderDashboard() {
    document.getElementById('totalTickets').textContent = currentTickets.length;
    document.getElementById('openTickets').textContent = currentTickets.filter(t => t.status === 'Aberto').length;
    document.getElementById('inProgressTickets').textContent = currentTickets.filter(t => t.status === 'Em Andamento').length;
    document.getElementById('resolvedTickets').textContent = currentTickets.filter(t => t.status === 'Resolvido').length;
}

// Tickets recentes no dashboard
function renderRecentTickets() {
    const recentTicketsList = document.getElementById('recentTicketsList');
    if (!recentTicketsList) return;
    recentTicketsList.innerHTML = '';
    let recent = currentTickets.slice(0, 5);
    if (recent.length === 0) {
        recentTicketsList.innerHTML = '<p style="padding: 1.5rem; text-align: center; color: #6b7280;">Nenhum ticket recente</p>';
        return;
    }
    recent.forEach(ticket => {
        const ticketDiv = document.createElement('div');
        ticketDiv.className = 'ticket-item';
        ticketDiv.onclick = () => openTicketModal(ticket);

        const createdDate = new Date(ticket.createdAt).toLocaleDateString('pt-BR');
        const createdTime = new Date(ticket.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        ticketDiv.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-info">
                    <h3>${ticket.ticketNumber}</h3>
                    <p><strong>${ticket.firstName} ${ticket.lastName}</strong> - ${ticket.department}</p>
                    <p>${ticket.destinationArea}</p>
                    <p style="color: #9ca3af; font-size: 0.75rem;">${createdDate} às ${createdTime}</p>
                </div>
                <div class="ticket-badges">
                    <span class="badge status-${(ticket.status || '').toLowerCase().replace(' ', '-')}">${ticket.status}</span>
                    <span class="badge priority-${(ticket.priority || '').toLowerCase()}">${ticket.priority}</span>
                </div>
            </div>
            <p style="color: #4b5563; margin-top: 0.5rem;">${ticket.description ? ticket.description.substring(0, 100) : ''}${ticket.description && ticket.description.length > 100 ? '...' : ''}</p>
        `;
        recentTicketsList.appendChild(ticketDiv);
    });
}

// Estatísticas por status/prioridade
function renderStats() {
    const statusChart = document.getElementById('statusChart');
    if (statusChart) {
        statusChart.innerHTML = '';
        const statusTypes = ['Aberto', 'Em Andamento', 'Resolvido', 'Fechado'];
        statusTypes.forEach(status => {
            const count = currentTickets.filter(t => t.status === status).length;
            statusChart.innerHTML += `
                <div class="chart-item">
                    <span>${status}</span>
                    <span>${count}</span>
                </div>
            `;
        });
    }

    const priorityChart = document.getElementById('priorityChart');
    if (priorityChart) {
        priorityChart.innerHTML = '';
        const priorityTypes = ['Crítica', 'Alta', 'Média', 'Baixa'];
        priorityTypes.forEach(priority => {
            const count = currentTickets.filter(t => t.priority === priority).length;
            priorityChart.innerHTML += `
                <div class="chart-item">
                    <span>${priority}</span>
                    <span>${count}</span>
                </div>
            `;
        });
    }
}

// Abrir modal do ticket
function openTicketModal(ticket) {
    selectedTicket = ticket;
    const modal = document.getElementById('ticketModal');
    if (!modal) return;
    modal.classList.add('active');
    document.getElementById('modalTitle').textContent = `Ticket ${ticket.ticketNumber}`;
    document.getElementById('modalBody').innerHTML = `
        <p><strong>Nome:</strong> ${ticket.firstName} ${ticket.lastName}</p>
        <p><strong>Setor:</strong> ${ticket.department}</p>
        <p><strong>Área de Destino:</strong> ${ticket.destinationArea}</p>
        <p><strong>Assunto:</strong> ${ticket.subject}</p>
        <p><strong>Descrição:</strong> ${ticket.description}</p>
        <p><strong>Status:</strong> 
            <select id="modalStatus" onchange="updateTicketField('status', this.value)">
                <option value="Aberto" ${ticket.status === 'Aberto' ? 'selected' : ''}>Aberto</option>
                <option value="Em Andamento" ${ticket.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                <option value="Resolvido" ${ticket.status === 'Resolvido' ? 'selected' : ''}>Resolvido</option>
                <option value="Fechado" ${ticket.status === 'Fechado' ? 'selected' : ''}>Fechado</option>
            </select>
        </p>
        <p><strong>Prioridade:</strong> 
            <select id="modalPriority" onchange="updateTicketField('priority', this.value)">
                <option value="Baixa" ${ticket.priority === 'Baixa' ? 'selected' : ''}>Baixa</option>
                <option value="Média" ${ticket.priority === 'Média' ? 'selected' : ''}>Média</option>
                <option value="Alta" ${ticket.priority === 'Alta' ? 'selected' : ''}>Alta</option>
                <option value="Crítica" ${ticket.priority === 'Crítica' ? 'selected' : ''}>Crítica</option>
            </select>
        </p>
        <p><strong>Contato:</strong> ${ticket.contact || 'Não informado'}</p>
        <p><strong>Criado:</strong> ${new Date(ticket.createdAt).toLocaleString('pt-BR')}</p>
        <p><strong>Atualizado:</strong> ${new Date(ticket.updatedAt).toLocaleString('pt-BR')}</p>
        <button onclick="deleteTicket()" style="background: #dc2626; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer;">
            <i class="fas fa-trash"></i> Deletar
        </button>
        <button onclick="closeModal()" style="margin-left: 1rem;">Fechar</button>
    `;
}

// Fechar modal
function closeModal() {
    document.getElementById('ticketModal').classList.remove('active');
    selectedTicket = null;
}

// Atualizar campo do ticket
async function updateTicketField(field, value) {
    if (!selectedTicket) return;
    const updates = {};
    updates[field] = value;
    try {
        await window.ticketDB.updateTicket(selectedTicket.id, updates);
        selectedTicket[field] = value;
        showToast('Atualizado com sucesso!');
        loadTickets();
    } catch (error) {
        showToast('Erro ao atualizar ticket', 'error');
    }
}

// Deletar ticket
async function deleteTicket() {
    if (!selectedTicket) return;
    if (confirm('Tem certeza que deseja deletar este ticket?')) {
        try {
            await window.ticketDB.deleteTicket(selectedTicket.id);
            showToast('Ticket deletado com sucesso!');
            closeModal();
            loadTickets();
        } catch {
            showToast('Erro ao deletar ticket', 'error');
        }
    }
}

// Função para mostrar toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show';
    if (type === 'error') toast.classList.add('error');
    else toast.classList.remove('error');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}