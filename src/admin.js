// Gerenciamento do painel administrativo
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    setupEventListeners();
});

let currentTickets = [];
let selectedTicket = null;

function setupEventListeners() {
    // Filtros
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('priorityFilter').addEventListener('change', applyFilters);
    
    // Modal
    document.getElementById('ticketModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

// Gerenciamento de tabs
function showTab(tabName) {
    // Ocultar todas as tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover classe active dos botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar tab selecionada
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Carregar conteúdo específico da tab
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'tickets':
            loadTickets();
            break;
        case 'stats':
            loadStatistics();
            break;
    }
}

// Carregar dashboard
function loadDashboard() {
    const stats = ticketDB.getStatistics();
    
    // Atualizar contadores
    document.getElementById('totalTickets').textContent = stats.total;
    document.getElementById('openTickets').textContent = stats.byStatus['Aberto'] || 0;
    document.getElementById('inProgressTickets').textContent = stats.byStatus['Em Andamento'] || 0;
    document.getElementById('resolvedTickets').textContent = stats.byStatus['Resolvido'] || 0;
    
    // Carregar tickets recentes
    const recentTickets = ticketDB.getAllTickets()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    const recentList = document.getElementById('recentTicketsList');
    recentList.innerHTML = '';
    
    if (recentTickets.length === 0) {
        recentList.innerHTML = '<p style="padding: 1.5rem; text-align: center; color: #6b7280;">Nenhum ticket encontrado</p>';
        return;
    }
    
    recentTickets.forEach(ticket => {
        const ticketElement = createTicketElement(ticket);
        recentList.appendChild(ticketElement);
    });
}

// Carregar todos os tickets
function loadTickets() {
    currentTickets = ticketDB.getAllTickets().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    renderTickets(currentTickets);
}

// Aplicar filtros
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    
    const filters = {
        search: searchTerm,
        status: statusFilter,
        priority: priorityFilter
    };
    
    const filteredTickets = ticketDB.filterTickets(filters);
    renderTickets(filteredTickets);
}

// Renderizar lista de tickets
function renderTickets(tickets) {
    const ticketsList = document.getElementById('ticketsList');
    ticketsList.innerHTML = '';
    
    if (tickets.length === 0) {
        ticketsList.innerHTML = '<p style="padding: 1.5rem; text-align: center; color: #6b7280;">Nenhum ticket encontrado</p>';
        return;
    }
    
    tickets.forEach(ticket => {
        const ticketElement = createTicketElement(ticket);
        ticketsList.appendChild(ticketElement);
    });
}

// Criar elemento de ticket
function createTicketElement(ticket) {
    const ticketDiv = document.createElement('div');
    ticketDiv.className = 'ticket-item';
    ticketDiv.onclick = () => openTicketModal(ticket);
    
    const createdDate = new Date(ticket.createdAt).toLocaleDateString('pt-BR');
    const createdTime = new Date(ticket.createdAt).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    ticketDiv.innerHTML = `
        <div class="ticket-header">
            <div class="ticket-info">
                <h3>
                    ${ticket.ticketNumber}
                    ${ticket.files && ticket.files.length > 0 ? '<i class="fas fa-paperclip" style="color: #6b7280; font-size: 0.875rem;"></i>' : ''}
                </h3>
                <p><strong>${ticket.firstName} ${ticket.lastName}</strong> - ${ticket.department}</p>
                <p>${ticket.destinationArea}</p>
                <p style="color: #9ca3af; font-size: 0.75rem;">${createdDate} às ${createdTime}</p>
            </div>
            <div class="ticket-badges">
                <span class="badge status-${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span>
                <span class="badge priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span>
            </div>
        </div>
        <p style="color: #4b5563; margin-top: 0.5rem;">${ticket.description.substring(0, 100)}${ticket.description.length > 100 ? '...' : ''}</p>
    `;
    
    return ticketDiv;
}

// Abrir modal do ticket
function openTicketModal(ticket) {
    selectedTicket = ticket;
    const modal = document.getElementById('ticketModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = `Ticket ${ticket.ticketNumber}`;
    
    const createdDate = new Date(ticket.createdAt).toLocaleString('pt-BR');
    const updatedDate = new Date(ticket.updatedAt).toLocaleString('pt-BR');
    
    let filesHtml = '';
    if (ticket.files && ticket.files.length > 0) {
        filesHtml = `
            <div style="margin-top: 1rem;">
                <h4 style="margin-bottom: 0.5rem; font-weight: 600;">Arquivos Anexados:</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${ticket.files.map((file, index) => `
                        <button onclick="downloadFile('${ticket.id}', ${index})" 
                                style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f3f4f6; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.875rem;">
                            <i class="fas fa-download"></i>
                            ${file.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    let notesHtml = '';
    if (ticket.notes && ticket.notes.length > 0) {
        notesHtml = `
            <div style="margin-top: 1.5rem;">
                <h4 style="margin-bottom: 0.75rem; font-weight: 600;">Notas:</h4>
                ${ticket.notes.map(note => `
                    <div style="background: #f9fafb; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem;">
                        <p style="margin-bottom: 0.25rem;">${note.text}</p>
                        <small style="color: #6b7280;">${new Date(note.createdAt).toLocaleString('pt-BR')}</small>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
            <div>
                <label style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Nome Completo</label>
                <p>${ticket.firstName} ${ticket.lastName}</p>
            </div>
            <div>
                <label style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Setor</label>
                <p>${ticket.department}</p>
            </div>
            <div>
                <label style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Área de Destino</label>
                <p>${ticket.destinationArea}</p>
            </div>
            <div>
                <label style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Contato</label>
                <p>${ticket.contact || 'Não informado'}</p>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
            <div>
                <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Status</label>
                <select id="modalStatus" onchange="updateTicketField('status', this.value)" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem;">
                    <option value="Aberto" ${ticket.status === 'Aberto' ? 'selected' : ''}>Aberto</option>
                    <option value="Em Andamento" ${ticket.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                    <option value="Resolvido" ${ticket.status === 'Resolvido' ? 'selected' : ''}>Resolvido</option>
                    <option value="Fechado" ${ticket.status === 'Fechado' ? 'selected' : ''}>Fechado</option>
                </select>
            </div>
            <div>
                <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Prioridade</label>
                <select id="modalPriority" onchange="updateTicketField('priority', this.value)" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem;">
                    <option value="Baixa" ${ticket.priority === 'Baixa' ? 'selected' : ''}>Baixa</option>
                    <option value="Média" ${ticket.priority === 'Média' ? 'selected' : ''}>Média</option>
                    <option value="Alta" ${ticket.priority === 'Alta' ? 'selected' : ''}>Alta</option>
                    <option value="Crítica" ${ticket.priority === 'Crítica' ? 'selected' : ''}>Crítica</option>
                </select>
            </div>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
            <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Descrição</label>
            <div style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e5e7eb;">
                ${ticket.description}
            </div>
        </div>
        
        ${filesHtml}
        
        <div style="margin-top: 1.5rem;">
            <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Adicionar Nota</label>
            <div style="display: flex; gap: 0.5rem;">
                <textarea id="newNote" placeholder="Digite uma nota..." style="flex: 1; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.25rem; resize: vertical; min-height: 60px;"></textarea>
                <button onclick="addNote()" style="background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer;">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        </div>
        
        ${notesHtml}
        
        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.875rem; color: #6b7280;">
                <p>Criado: ${createdDate}</p>
                <p>Atualizado: ${updatedDate}</p>
            </div>
            <button onclick="deleteTicket()" style="background: #dc2626; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer;">
                <i class="fas fa-trash"></i>
                Deletar
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

// Fechar modal
function closeModal() {
    document.getElementById('ticketModal').classList.remove('active');
    selectedTicket = null;
}

// Atualizar campo do ticket
function updateTicketField(field, value) {
    if (!selectedTicket) return;
    
    const updates = {};
    updates[field] = value;
    
    if (ticketDB.updateTicket(selectedTicket.id, updates)) {
        selectedTicket[field] = value;
        showToast(`${field === 'status' ? 'Status' : 'Prioridade'} atualizado com sucesso!`);
        
        // Atualizar dashboard se estiver ativo
        const dashboardTab = document.getElementById('dashboard');
        if (dashboardTab.classList.contains('active')) {
            loadDashboard();
        }
        
        // Atualizar lista se estiver ativa
        const ticketsTab = document.getElementById('tickets');
        if (ticketsTab.classList.contains('active')) {
            applyFilters();
        }
    } else {
        showToast('Erro ao atualizar ticket', 'error');
    }
}

// Adicionar nota
function addNote() {
    if (!selectedTicket) return;
    
    const noteText = document.getElementById('newNote').value.trim();
    if (!noteText) {
        showToast('Digite uma nota antes de adicionar', 'error');
        return;
    }
    
    if (ticketDB.addNoteToTicket(selectedTicket.id, noteText)) {
        showToast('Nota adicionada com sucesso!');
        document.getElementById('newNote').value = '';
        
        // Recarregar modal
        const updatedTicket = ticketDB.getTicketById(selectedTicket.id);
        openTicketModal(updatedTicket);
    } else {
        showToast('Erro ao adicionar nota', 'error');
    }
}

// Deletar ticket
function deleteTicket() {
    if (!selectedTicket) return;
    
    if (confirm('Tem certeza que deseja deletar este ticket? Esta ação não pode ser desfeita.')) {
        if (ticketDB.deleteTicket(selectedTicket.id)) {
            showToast('Ticket deletado com sucesso!');
            closeModal();
            
            // Atualizar dashboard se estiver ativo
            const dashboardTab = document.getElementById('dashboard');
            if (dashboardTab.classList.contains('active')) {
                loadDashboard();
            }
            
            // Atualizar lista se estiver ativa
            const ticketsTab = document.getElementById('tickets');
            if (ticketsTab.classList.contains('active')) {
                loadTickets();
            }
        } else {
            showToast('Erro ao deletar ticket', 'error');
        }
    }
}

// Download de arquivo
function downloadFile(ticketId, fileIndex) {
    const ticket = ticketDB.getTicketById(ticketId);
    if (!ticket || !ticket.files || !ticket.files[fileIndex]) {
        showToast('Arquivo não encontrado', 'error');
        return;
    }
    
    const file = ticket.files[fileIndex];
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Carregar estatísticas
function loadStatistics() {
    const stats = ticketDB.getStatistics();
    
    // Status Chart
    const statusChart = document.getElementById('statusChart');
    statusChart.innerHTML = '';
    
    Object.entries(stats.byStatus).forEach(([status, count]) => {
        const item = document.createElement('div');
        item.className = 'chart-item';
        item.innerHTML = `
            <span>${status}</span>
            <span>${count}</span>
        `;
        statusChart.appendChild(item);
    });
    
    // Priority Chart
    const priorityChart = document.getElementById('priorityChart');
    priorityChart.innerHTML = '';
    
    Object.entries(stats.byPriority).forEach(([priority, count]) => {
        const item = document.createElement('div');
        item.className = 'chart-item';
        item.innerHTML = `
            <span>${priority}</span>
            <span>${count}</span>
        `;
        priorityChart.appendChild(item);
    });
}

// Função para mostrar toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show';
    
    if (type === 'error') {
        toast.classList.add('error');
    } else {
        toast.classList.remove('error');
    }
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}