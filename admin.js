// Painel administrativo - exibe e gerencia tickets do banco

document.addEventListener('DOMContentLoaded', function() {
    setupTabs();
    setupFilters();
    loadTickets();
});

let currentTickets = [];
let selectedTicket = null;
let isEditing = false;

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
async function openTicketModal(ticket) {
    selectedTicket = ticket;
    isEditing = false;
    
    try {
        // Carregar anotações do ticket
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

function renderModalContent() {
    const ticket = selectedTicket;
    const modalTitle = document.getElementById('modalTitle');
    modalTitle.textContent = `${ticket.ticketNumber}`;

    const modalBody = document.getElementById('modalBody');
    if (!modalBody) return;

    // Exibir links de download dos anexos salvos no backend
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

    // Mostrar anotações do ticket
    let historicoItems = [];
    
    // Adicionar anotações do banco de dados
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
    
    // Adicionar histórico legado se existir
    if (ticket.history && Array.isArray(ticket.history)) {
        historicoItems = [...historicoItems, ...ticket.history];
    }
    
    // Se não houver anotações, mostrar mensagem padrão
    if (historicoItems.length === 0) {
        historicoItems.push({
            user: 'Sistema',
            date: new Date().toLocaleString('pt-BR'),
            text: 'Ticket criado',
            color: '#3b82f6'
        });
    }
    
    // Renderizar histórico de anotações
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

    // Rodapé
    const rodape = `
        <div style="font-size:0.85rem;color:#a1a1aa;display:flex;justify-content:space-between;margin-top:12px;">
            <span>Criado: ${new Date(ticket.createdAt).toLocaleString('pt-BR')}</span>
            <span>Atualizado: ${new Date(ticket.updatedAt).toLocaleString('pt-BR')}</span>
            <span>Tempo de chamado: 5:32</span>
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
                        <label>Sobrenome:</label>
                        <input type="text" value="${ticket.lastName}" disabled>
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
                <div class="rodape">
                    <span>Criado: ${new Date(ticket.createdAt).toLocaleString('pt-BR')}</span>
                    <span>Atualizado: ${new Date(ticket.updatedAt).toLocaleString('pt-BR')}</span>
                    <span>Tempo de chamado: 5:32</span>
                </div>
                <div class="modal-actions">
                    <button type="button" onclick="enableEdit()" class="edit-btn"><i class="fas fa-pen"></i> Editar</button>
                    <button type="button" onclick="closeModal()" class="close-btn">Fechar</button>
                </div>
            </form>
        `;
    } else {
        // Modo edição: todos campos habilitados
        modalBody.innerHTML = `
            <form class="modal-fields" onsubmit="return false;">
                <div class="modal-row">
                    <div>
                        <label>Nome:</label>
                        <input type="text" id="editFirstName" value="${ticket.firstName}">
                    </div>
                    <div>
                        <label>Sobrenome:</label>
                        <input type="text" id="editLastName" value="${ticket.lastName}">
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
                    <textarea id="editDescription">${ticket.description}</textarea>
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
                <div class="rodape">
                    <span>Criado: ${new Date(ticket.createdAt).toLocaleString('pt-BR')}</span>
                    <span>Atualizado: ${new Date(ticket.updatedAt).toLocaleString('pt-BR')}</span>
                    <span>Tempo de chamado: 5:32</span>
                </div>
                <div class="modal-actions">
                    <!--<button type="button" onclick="deleteTicket()" class="delete-btn"><i class="fas fa-trash"></i> Deletar</button>-->
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

    // Campos editáveis
    const fields = [
        'firstName', 'lastName', 'status', 'priority',
        'department', 'destinationArea', 'subject',
        'description'
    ];

    const updates = {};
    fields.forEach(field => {
        const input = document.getElementById('edit' + field.charAt(0).toUpperCase() + field.slice(1));
        if (input) {
            const newValue = input.value;
            if (selectedTicket[field] !== newValue) {
                updates[field] = newValue;
            }
        }
    });

    if (Object.keys(updates).length === 0) {
        showToast('Nenhuma alteração detectada.');
        return;
    }

    try {
        await window.ticketDB.updateTicket(selectedTicket.id, updates);
        showToast('Ticket atualizado com sucesso!');
        isEditing = false;
        loadTickets();
        closeModal();
    } catch {
        showToast('Erro ao salvar edição', 'error');
    }
}

// Fechar modal
function closeModal() {
    document.getElementById('ticketModal').classList.remove('active');
    selectedTicket = null;
}

// Atualizar campo do ticket
async function updateTicketField(field, value, event) {
    if (event) event.preventDefault();
    if (!selectedTicket) return;
    const updates = {};
    updates[field] = value;
    try {
        await window.ticketDB.updateTicket(selectedTicket.id, updates);
        selectedTicket[field] = value;
        showToast('Atualizado com sucesso!');
        loadTickets();
        // Não fecha o modal!
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

// Função para adicionar uma anotação
async function addAnnotation(ticketId) {
    const annotationInput = document.getElementById('newAnnotation');
    const text = annotationInput.value.trim();
    
    if (!text) {
        showToast('Digite uma anotação', 'error');
        return;
    }
    
    try {
        // Usuário simulado - em um sistema real, seria obtido do login
        const user = 'Admin';
        
        // Chamar API para adicionar anotação
        await window.ticketDB.addAnnotation(ticketId, text, user);
        
        // Recarregar anotações e atualizar modal
        const annotations = await window.ticketDB.getAnnotations(ticketId);
        selectedTicket.annotations = annotations;
        
        // Limpar campo de entrada
        annotationInput.value = '';
        
        // Atualizar modal sem fechá-lo
        renderModalContent();
        
        // Mostra mensagem de sucesso
        showToast('Anotação adicionada com sucesso');
        
        // Atualiza a lista de tickets em segundo plano
        loadTickets();
    } catch (error) {
        console.error('Erro ao adicionar anotação:', error);
        showToast('Erro ao adicionar anotação', 'error');
    }
}

// Função para deletar uma anotação
async function deleteAnnotation(event, ticketId, annotationId) {
    event.stopPropagation();
    
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) {
        return;
    }
    
    try {
        // Chamar API para deletar anotação
        await window.ticketDB.deleteAnnotation(ticketId, annotationId);
        
        // Recarregar anotações e atualizar modal
        const annotations = await window.ticketDB.getAnnotations(ticketId);
        selectedTicket.annotations = annotations;
        
        // Atualizar modal sem fechá-lo
        renderModalContent();
        
        // Mostrar notificação de sucesso
        showToast('Anotação excluída com sucesso');
        
        // Atualizar a lista de tickets em segundo plano
        loadTickets();
    } catch (error) {
        console.error('Erro ao excluir anotação:', error);
        showToast('Erro ao excluir anotação', 'error');
    }
}

// Função para fazer upload de arquivo para ticket
async function uploadFileToTicket(ticketId) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validar tamanho (10MB)
        if (file.size > 10 * 1024 * 1024) {
            showToast(`Arquivo ${file.name} é muito grande. Máximo 10MB.`, 'error');
            return;
        }
        
        try {
            // Mostrar indicador de carregamento
            showToast('Enviando arquivo...', 'info');
            
            // Fazer upload do arquivo
            await window.ticketDB.uploadFile(ticketId, file);
            
            // Recarregar ticket e atualizar modal
            const updatedTicket = await window.ticketDB.getTicketById(ticketId);
            selectedTicket = updatedTicket;
            
            // Carregar anotações atualizadas
            const annotations = await window.ticketDB.getAnnotations(ticketId);
            selectedTicket.annotations = annotations;
            
            // Atualizar modal sem fechá-lo
            renderModalContent();
            
            // Mostrar notificação de sucesso
            showToast('Arquivo enviado com sucesso');
            
            // Atualizar a lista de tickets em segundo plano
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

// Função para mostrar toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show';
    if (type === 'error') toast.classList.add('error');
    else toast.classList.remove('error');
    // Aumenta o tempo de exibição para 5 segundos
    setTimeout(() => { toast.classList.remove('show'); }, 5000);
}