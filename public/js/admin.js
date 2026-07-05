// Painel administrativo - exibe e gerencia tickets do banco
document.addEventListener('DOMContentLoaded', function() {
    setupTabs();
    setupFilters();
    setupBackButton(); // Movido para função separada
    loadTickets();
});

let userTickets = []; // Tickets que o user abriu (Minhas solicitações)
let areaTickets = []; // Tickets destinados à área do user (Solicitações para mim)
let allTicketsRaw = [];
let selectedTicket = null;
let isEditing = false;
let currentTab = 'dashboard';

// Tabs
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.querySelector(`.tab-btn[onclick="showTab('${tabId}')"]`);
    if (btn) btn.classList.add('active');
    
    currentTab = tabId;
    renderTabsContent();
}

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const tabId = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
        btn.onclick = () => showTab(tabId);
    });
    showTab('tickets'); // Aba padrão ao carregar
}

function renderTabsContent() {
    if (currentTab === 'dashboard') {
        renderDashboard(userTickets);
        renderRecentTickets(userTickets);
    } else if (currentTab === 'tickets') {
        // Na aba "Solicitações para mim", usamos areaTickets
        renderTickets(areaTickets);
        // Aplicar filtros imediatamente
        filterTickets();
    } else if (currentTab === 'stats') {
        renderStats(userTickets);
    }
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

// Função para extrair ?user= e ?area= da URL
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        user: params.get('user') ? params.get('user').trim().toUpperCase() : null,
        area: params.get('area') ? params.get('area').trim() : null
    };
}

// Tickets criados pelo usuário
function getTicketsForUser(ticketsRaw, login) {
    if (!login) return [];
    return ticketsRaw.filter(ticket => {
        const userInTicket = (ticket.username || '').trim().toUpperCase();
        if (userInTicket === login) return true;
        const nomeCompleto = ((ticket.firstName || '') + ' ' + (ticket.lastName || '')).trim().toUpperCase();
        return nomeCompleto === login;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Tickets destinados à área
function getTicketsForArea(ticketsRaw, area) {
    if (!area) return [];
    return ticketsRaw.filter(ticket => (ticket.destinationArea || '').trim() === area)
                     .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Carregar tickets e separar por contexto
async function loadTickets() {
    try {
        allTicketsRaw = await window.ticketDB.getAllTickets();
        const { user, area } = getUrlParams();
        
        userTickets = getTicketsForUser(allTicketsRaw, user);
        areaTickets = getTicketsForArea(allTicketsRaw, area);
        
        renderTabsContent();
        window.checkDbStatus();
    } catch {
        showToast('Erro ao carregar tickets', 'error');
        window.checkDbStatus();
    }
}

// Renderizar tickets na lista
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
                    <p>
                        <strong>
                            Solicitante: ${ticket.firstName} <br>
                        </strong>
                        <strong>
                            De: ${ticket.department}
                         </strong>
                    </p>
                    <p>
                        <strong>
                            Para: ${ticket.destinationArea}
                        </strong>
                    </p>
                    <p style="color: #9ca3af; font-size: 0.75rem;">${createdDate} às ${createdTime}</p>
                </div>
                <div class="ticket-badges">
                    <span class="badge status-${(ticket.status || '').toLowerCase().replace(' ', '-')}">${ticket.status}</span>
                    <span class="badge priority-${(ticket.priority || '').toLowerCase()}">${ticket.priority}</span>
                </div>
            </div>
            <p style="color: white; margin-top: 0.5rem;">${ticket.subject ? ticket.subject.substring(0, 100) : ''}${ticket.description && ticket.description.length > 100 ? '...' : ''}</p>
        `;
        ticketsList.appendChild(ticketDiv);
    });
}

// Filtro de tickets — agora filtra APENAS areaTickets
function filterTickets() {
    if (currentTab !== 'tickets') return;

    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const status = document.getElementById('statusFilter')?.value || 'all';
    const priority = document.getElementById('priorityFilter')?.value || 'all';

    let filtered = areaTickets.filter(ticket => {
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

// Dashboard - estatísticas (baseado em userTickets)
function renderDashboard(tickets) {
    document.getElementById('totalTickets').textContent = tickets.length;
    document.getElementById('openTickets').textContent = tickets.filter(t => t.status === 'Aberto').length;
    document.getElementById('inProgressTickets').textContent = tickets.filter(t => t.status === 'Em Andamento').length;
    document.getElementById('resolvedTickets').textContent = tickets.filter(t => t.status === 'Resolvido').length;
}

// Tickets recentes no dashboard
function renderRecentTickets(tickets) {
    const recentTicketsList = document.getElementById('recentTicketsList');
    if (!recentTicketsList) return;
    recentTicketsList.innerHTML = '';
    let recent = tickets.slice(0, 5);
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
                    <p>
                        <strong>
                            Solicitante: ${ticket.firstName} <br>
                        </strong>
                        <strong>
                    </p>
                    <p>
                        <strong>
                            De: ${ticket.department}
                        </strong>
                    </p>
                    <p>
                        <strong>
                            Para: ${ticket.destinationArea}
                        </strong>
                    </p>
                    <p style="color: #9ca3af; font-size: 0.75rem;">${createdDate} às ${createdTime}</p>
                </div>
                <div class="ticket-badges">
                    <span class="badge status-${(ticket.status || '').toLowerCase().replace(' ', '-')}">${ticket.status}</span>
                    <span class="badge priority-${(ticket.priority || '').toLowerCase()}">${ticket.priority}</span>
                </div>
            </div>
            <p style="color: white; margin-top: 0.5rem;">${ticket.subject ? ticket.subject.substring(0, 100) : ''}${ticket.description && ticket.description.length > 100 ? '...' : ''}</p>
        `;
        recentTicketsList.appendChild(ticketDiv);
    });
}

// Estatísticas
function renderStats(tickets) {
    const statusChart = document.getElementById('statusChart');
    if (statusChart) {
        statusChart.innerHTML = '';
        const statusTypes = ['Aberto', 'Em Andamento', 'Resolvido', 'Fechado'];
        statusTypes.forEach(status => {
            const count = tickets.filter(t => t.status === status).length;
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
            const count = tickets.filter(t => t.priority === priority).length;
            priorityChart.innerHTML += `
                <div class="chart-item">
                    <span>${priority}</span>
                    <span>${count}</span>
                </div>
            `;
        });
    }
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// >>>>> A PARTIR DAQUI, TUDO É MANTIDO EXATAMENTE COMO VOCÊ TINHA! <<<<<<
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// Abrir modal do ticket
async function openTicketModal(ticket) {
    selectedTicket = ticket;
    isEditing = false;
    
    try {
        const annotations = await window.ticketDB.getAnnotations(ticket.id);
        selectedTicket.annotations = annotations;
        renderModalContent();
        document.getElementById('ticketModal').classList.add('active');
    } catch (error) {
        console.error("Erro ao carregar anotações:", error);
        showToast("Erro ao carregar anotações do ticket", "error");
        renderModalContent();
        document.getElementById('ticketModal').classList.add('active');
    }
}

function calculateTicketDuration(ticket) {
    const createdAt = new Date(ticket.createdAt);
    const endTime = ticket.closedAt ? new Date(ticket.closedAt) : new Date();
    const diffMs = endTime - createdAt;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffDays > 0) {
        return `${diffDays}d${diffHours}h`;
    } else {
        return `${diffHours}:${diffMinutes.toString().padStart(2, '0')}`;
    }
}

function renderModalContent() {
    const ticket = selectedTicket;
    const modalTitle = document.getElementById('modalTitle');
    modalTitle.textContent = `${ticket.ticketNumber}`;

    const modalBody = document.getElementById('modalBody');
    if (!modalBody) return;

    let anexos = 'Nenhum arquivo anexado';
    if (ticket.attachments) {
        let attachmentsList = [];
        try {
            if (typeof ticket.attachments === 'string') {
                attachmentsList = JSON.parse(ticket.attachments);
            } else if (Array.isArray(ticket.attachments)) {
                attachmentsList = ticket.attachments;
            }
        } catch (e) {
            console.error('Erro ao parsear anexos:', e);
        }
        
        if (attachmentsList.length > 0) {
            anexos = attachmentsList.map(attachment => {
                const filePath = attachment.path;
                const fileName = attachment.name || filePath.split('/').pop();
                return `<a href="${filePath}" download="${fileName}" style="color:#3b82f6;text-decoration:underline;margin-right:8px;"><i class="fas fa-paperclip"></i> ${fileName}</a>`;
            }).join('<br>');
        }
    }

    let historicoItems = [];
    if (ticket.annotations && Array.isArray(ticket.annotations)) {
        historicoItems = ticket.annotations.map(annotation => {
            const date = new Date(annotation.createdAt).toLocaleString('pt-BR');
            return {
                id: annotation.id,
                user: annotation.user,
                date: date,
                text: annotation.text,
                color: annotation.text.includes('Arquivo anexado') ? '#22c55e' : '#3b82f6'
            };
        });
    }
    if (ticket.history && Array.isArray(ticket.history)) {
        historicoItems = [...historicoItems, ...ticket.history];
    }
    if (historicoItems.length === 0) {
        historicoItems.push({
            user: 'Sistema',
            date: new Date().toLocaleString('pt-BR'),
            text: 'Ticket criado',
            color: '#3b82f6'
        });
    }
    
    const historico = historicoItems.map(h => `
        <div style="margin-bottom:12px;" ${h.id ? `data-annotation-id="${h.id}"` : ''}>
            <span style="font-weight:600;color:#fff;">${h.user}</span> 
            <span style="color:#a1a1aa;">- ${h.date}</span>
            <div style="color:${h.color};margin-left:8px;">
                ${h.text}
                ${h.id && !isEditing ? `<button onclick="deleteAnnotation(event, ${ticket.id}, ${h.id})" class="delete-annotation-btn"><i class="fas fa-times"></i></button>` : ''}
            </div>
        </div>
    `).join('');
    
    const createdDate = new Date(ticket.createdAt).toLocaleString('pt-BR');
    const updatedDate = new Date(ticket.updatedAt).toLocaleString('pt-BR');
    const ticketDuration = calculateTicketDuration(ticket);

    const rodape = `
        <div class="rodape">
            <span>Criado: ${createdDate}</span>
            <span>Atualizado: ${updatedDate}</span>
            <span>Tempo de chamado: ${ticketDuration}</span>
        </div>
    `;

    if (!isEditing) {
        modalBody.innerHTML = `
            <form class="modal-fields" onsubmit="return false;">
                <div class="modal-row">
                    <div>
                        <label>Nome:</label>
                        <input type="text" value="${ticket.firstName}" disabled>
                    </div>
                    <div>
                        <label>Status:</label>
                        <select id="modalStatus" onchange="updateTicketField('status', this.value, event)" disabled>
                            <option value="Aberto" ${ticket.status === 'Aberto' ? 'selected' : ''}>Aberto</option>
                            <option value="Em Andamento" ${ticket.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                            <option value="Resolvido" ${ticket.status === 'Resolvido' ? 'selected' : ''}>Resolvido</option>
                            <option value="Fechado" ${ticket.status === 'Fechado' ? 'selected' : ''}>Fechado</option>
                        </select>
                    </div>
                    <div>
                        <label>Prioridade:</label>
                        <select id="modalPriority" onchange="updateTicketField('priority', this.value, event)" disabled>
                            <option value="Baixa" ${ticket.priority === 'Baixa' ? 'selected' : ''}>Baixa</option>
                            <option value="Média" ${ticket.priority === 'Média' ? 'selected' : ''}>Média</option>
                            <option value="Alta" ${ticket.priority === 'Alta' ? 'selected' : ''}>Alta</option>
                            <option value="Crítica" ${ticket.priority === 'Crítica' ? 'selected' : ''}>Crítica</option>
                        </select>
                    </div>
                </div>
                <div class="modal-row">
                    <div>
                        <label>Área Solicitante:</label>
                        <select disabled>
                            <option>${ticket.department}</option>
                        </select>
                    </div>
                    <div>
                        <label>Área Destino:</label>
                        <select disabled>
                            <option>${ticket.destinationArea}</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label>Assunto:</label>
                    <input type="text" value="${ticket.subject}" class="assunto" disabled>
                </div>
                <div>
                    <label>Descrição:</label>
                    <textarea disabled>${ticket.description}</textarea>
                </div>
                <div>
                    <label>Anexos:</label>
                    <div class="anexos">
                        ${anexos}
                        <button type="button" onclick="uploadFileToTicket(${ticket.id})" class="upload-btn">
                            <i class="fas fa-paperclip"></i> Adicionar arquivo
                        </button>
                    </div>
                </div>
                <div>
                    <label>Anotações:</label>
                    <div class="anotacoes">
                        <input type="text" id="newAnnotation" placeholder="Adicionar uma anotação...">
                        <button type="button" onclick="addAnnotation(${ticket.id})"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
                <div>
                    <label>Histórico:</label>
                    <div class="historico">${historico}</div>
                </div>
                ${rodape}
                <div class="modal-actions">
                    <button type="button" onclick="enableEdit()" class="edit-btn"><i class="fas fa-pen"></i> Editar</button>
                    <button type="button" onclick="closeModal()" class="close-btn">Fechar</button>
                </div>
            </form>
        `;
    } else {
        modalBody.innerHTML = `
            <form class="modal-fields" onsubmit="return false;">
                <div class="modal-row">
                    <div>
                        <label>Nome:</label>
                        <input type="text" id="editFirstName" value="${ticket.firstName}">
                    </div>
                    <div>
                        <label>Status:</label>
                        <select id="editStatus">
                            <option value="Aberto" ${ticket.status === 'Aberto' ? 'selected' : ''}>Aberto</option>
                            <option value="Em Andamento" ${ticket.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                            <option value="Resolvido" ${ticket.status === 'Resolvido' ? 'selected' : ''}>Resolvido</option>
                            <option value="Fechado" ${ticket.status === 'Fechado' ? 'selected' : ''}>Fechado</option>
                        </select>
                    </div>
                    <div>
                        <label>Prioridade:</label>
                        <select id="editPriority">
                            <option value="Baixa" ${ticket.priority === 'Baixa' ? 'selected' : ''}>Baixa</option>
                            <option value="Média" ${ticket.priority === 'Média' ? 'selected' : ''}>Média</option>
                            <option value="Alta" ${ticket.priority === 'Alta' ? 'selected' : ''}>Alta</option>
                            <option value="Crítica" ${ticket.priority === 'Crítica' ? 'selected' : ''}>Crítica</option>
                        </select>
                    </div>
                </div>
                <div class="modal-row">
                    <div>
                        <label>Área Solicitante:</label>
                        <select id="editDepartment" disabled>
                            <option>${ticket.department}</option>
                        </select>
                    </div>
                    <div>
                        <label>Área Destino:</label>
                        <select id="editDestinationArea" disabled>
                            <option>${ticket.destinationArea}</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label>Assunto:</label>
                    <input type="text" id="editSubject" value="${ticket.subject}" class="assunto">
                </div>
                <div>
                    <label>Descrição:</label>
                    <textarea id="editDescription" style="width: 200px;">${ticket.description}</textarea>
                </div>
                <div>
                    <label>Anexos:</label>
                    <div class="anexos">
                        ${anexos}
                        <button type="button" onclick="uploadFileToTicket(${ticket.id})" class="upload-btn">
                            <i class="fas fa-paperclip"></i> Adicionar arquivo
                        </button>
                    </div>
                </div>
                <div>
                    <label>Anotações:</label>
                    <div class="anotacoes">
                        <input type="text" id="newAnnotation" placeholder="Adicionar uma anotação...">
                        <button type="button" onclick="addAnnotation(${ticket.id})"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
                <div>
                    <label>Histórico:</label>
                    <div class="historico">${historico}</div>
                </div>
                ${rodape}
                <div class="modal-actions">
                    <button type="button" onclick="saveEdit()" class="save-btn"><i class="fas fa-save"></i> Salvar</button>
                    <button type="button" onclick="disabledEdit()" class="close-btn">Cancelar</button>
                </div>
            </form>
        `;
    }
}

function enableEdit() {
    isEditing = true;
    renderModalContent();
}

function disabledEdit() {
    isEditing = false;
    renderModalContent();
}

async function saveEdit() {
    if (!selectedTicket) return;

    const fields = [
        'firstName', 'lastName', 'status', 'priority',
        'department', 'destinationArea', 'subject',
        'description'
    ];

    const updates = {};
    let statusChanged = false;
    let newStatus = '';
    
    fields.forEach(field => {
        const input = document.getElementById('edit' + field.charAt(0).toUpperCase() + field.slice(1));
        if (input) {
            const newValue = input.value;
            if (selectedTicket[field] !== newValue) {
                updates[field] = newValue;
                if (field === 'status') {
                    statusChanged = true;
                    newStatus = newValue;
                }
            }
        }
    });

    if (Object.keys(updates).length === 0) {
        showToast('Nenhuma alteração detectada.');
        return;
    }

    try {
        const updatedTicket = await window.ticketDB.updateTicket(selectedTicket.id, updates);
        if (statusChanged && (newStatus === 'Resolvido' || newStatus === 'Fechado')) {
            await window.ticketDB.addAnnotation(
                selectedTicket.id, 
                `Ticket marcado como ${newStatus}`, 
                'Sistema'
            );
        }
        showToast('Ticket atualizado com sucesso!');
        isEditing = false;
        loadTickets();
        closeModal();
    } catch (error) {
        console.error('Erro ao salvar edição:', error);
        showToast('Erro ao salvar edição', 'error');
    }
}

function closeModal() {
    document.getElementById('ticketModal').classList.remove('active');
    selectedTicket = null;
}

async function updateTicketField(field, value, event) {
    if (event) event.preventDefault();
    if (!selectedTicket) return;
    const updates = {};
    updates[field] = value;
    
    try {
        const updatedTicket = await window.ticketDB.updateTicket(selectedTicket.id, updates);
        selectedTicket[field] = value;
        
        if (field === 'status' && (value === 'Resolvido' || value === 'Fechado')) {
            await window.ticketDB.addAnnotation(
                selectedTicket.id, 
                `Ticket marcado como ${value}`, 
                'Sistema'
            );
            const annotations = await window.ticketDB.getAnnotations(selectedTicket.id);
            selectedTicket.annotations = annotations;
            const refreshedTicket = await window.ticketDB.getTicketById(selectedTicket.id);
            if (refreshedTicket) {
                selectedTicket = {...selectedTicket, ...refreshedTicket};
            }
            renderModalContent();
        }
        
        showToast('Atualizado com sucesso!');
        loadTickets();
    } catch (error) {
        console.error('Erro ao atualizar ticket:', error);
        showToast('Erro ao atualizar ticket', 'error');
    }
}

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

async function addAnnotation(ticketId) {
    const annotationInput = document.getElementById('newAnnotation');
    const text = annotationInput.value.trim();
    if (!text) {
        showToast('Digite uma anotação', 'error');
        return;
    }
    try {
        const user = localStorage.getItem('loggedUser') || 'Admin';
        await window.ticketDB.addAnnotation(ticketId, text, user);
        const annotations = await window.ticketDB.getAnnotations(ticketId);
        selectedTicket.annotations = annotations;
        annotationInput.value = '';
        renderModalContent();
        showToast('Anotação adicionada com sucesso');
        loadTickets();
    } catch (error) {
        console.error('Erro ao adicionar anotação:', error);
        showToast('Erro ao adicionar anotação', 'error');
    }
}

async function deleteAnnotation(event, ticketId, annotationId) {
    event.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) return;
    try {
        await window.ticketDB.deleteAnnotation(ticketId, annotationId);
        const annotations = await window.ticketDB.getAnnotations(ticketId);
        selectedTicket.annotations = annotations;
        renderModalContent();
        showToast('Anotação excluída com sucesso');
        loadTickets();
    } catch (error) {
        console.error('Erro ao excluir anotação:', error);
        showToast('Erro ao excluir anotação', 'error');
    }
}

async function uploadFileToTicket(ticketId) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            showToast(`Arquivo ${file.name} é muito grande. Máximo 10MB.`, 'error');
            return;
        }
        try {
            showToast('Enviando arquivo...', 'info');
            const loggedUser = localStorage.getItem('loggedUser') || 'Sistema';
            await window.ticketDB.uploadFile(ticketId, file, loggedUser);
            const updatedTicket = await window.ticketDB.getTicketById(ticketId);
            selectedTicket = updatedTicket;
            const annotations = await window.ticketDB.getAnnotations(ticketId);
            selectedTicket.annotations = annotations;
            renderModalContent();
            showToast('Arquivo enviado com sucesso');
            loadTickets();
        } catch (error) {
            console.error('Erro ao enviar arquivo:', error);
            showToast('Erro ao enviar arquivo', 'error');
        } finally {
            document.body.removeChild(fileInput);
        }
    });
    
    fileInput.click();
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show';
    if (type === 'error') toast.classList.add('error');
    else toast.classList.remove('error');
    setTimeout(() => { toast.classList.remove('show'); }, 5000);
}

// Botão voltar
function setupBackButton() {
    const backBtn = document.getElementById('backIndexBtn');
    if (backBtn) {
        backBtn.onclick = function() {
            const params = new URLSearchParams(window.location.search);
            const user = params.get('user');
            if (user) {
                window.location.href = `/public/index.html?user=${encodeURIComponent(user)}&area=${encodeURIComponent(params.get('area') || '')}`;
            } else {
                window.location.href = '/public/index.html';
            }
        };
    }
}

// === NOTIFICAÇÃO SONORA COM ARQUIVO EXTERNO (notification.mp3) ===

let lastTicketCache = new Map();
let notificationInterval = null;
const NOTIFICATION_INTERVAL_MS = 30000; // 30s
const NEW_TICKET_WINDOW_MS = 20000;     // 20s
let userHasInteracted = false;
let audioElement = null;

// Cria o elemento de áudio uma vez
function createAudioElement() {
    if (audioElement) return;
    audioElement = new Audio('/public/sounds/notification.mp3');
    audioElement.preload = 'auto';
    audioElement.volume = 0.8;
}

// Toca o som (só se usuário interagiu)
function playNotificationSound() {
    if (document.visibilityState !== 'visible') return;
    
    if (userHasInteracted && audioElement) {
        // Tenta tocar
        audioElement.play().catch(err => {
            console.warn('Falha ao tocar notificação:', err);
            showToast('🔔 Novo chamado para sua área!', 'info');
        });
    } else {
        // Só mostra toast se áudio não puder tocar
        showToast('🔔 Novo chamado para sua área!', 'info');
    }
}

// Verifica novos chamados
async function checkForNewTickets() {
    try {
        const allTickets = await window.ticketDB.getAllTickets();
        const { area } = getUrlParams();
        if (!area) return;

        const now = Date.now();
        const currentOpenTickets = allTickets.filter(t =>
            (t.destinationArea || '').trim() === area &&
            t.status === 'Aberto' &&
            t.createdAt
        );

        let hasNewTicket = false;
        for (const ticket of currentOpenTickets) {
            const ticketId = ticket.id;
            const createdAt = new Date(ticket.createdAt).getTime();
            if (now - createdAt > NEW_TICKET_WINDOW_MS) continue;
            if (!lastTicketCache.has(ticketId)) {
                hasNewTicket = true;
                break;
            }
        }

        if (hasNewTicket) {
            playNotificationSound();
            loadTickets();
        }

        // Atualiza cache
        const newCache = new Map();
        currentOpenTickets.forEach(t => {
            newCache.set(t.id, new Date(t.createdAt).getTime());
        });
        lastTicketCache = newCache;

    } catch (error) {
        console.warn('Erro na verificação:', error);
    }
}

function startNotificationPolling() {
    if (notificationInterval) return;
    createAudioElement(); // Prepara o áudio
    checkForNewTickets().then(() => {
        notificationInterval = setInterval(checkForNewTickets, NOTIFICATION_INTERVAL_MS);
    });
}

function stopNotificationPolling() {
    if (notificationInterval) {
        clearInterval(notificationInterval);
        notificationInterval = null;
    }
}

// Ativa após primeira interação
function enableAudioOnInteraction() {
    userHasInteracted = true;
    // Remove os listeners
    ['click', 'keydown', 'touchstart'].forEach(type => {
        document.removeEventListener(type, enableAudioOnInteraction, { once: true });
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('area')) {
        // Prepara listeners de interação
        ['click', 'keydown', 'touchstart'].forEach(type => {
            document.addEventListener(type, enableAudioOnInteraction, { once: true });
        });
        startNotificationPolling();
    }
});

window.addEventListener('beforeunload', stopNotificationPolling);