// Detecta o IP do servidor onde a página está hospedada
const localIp = window.location.hostname;
const API_URL = `http://${localIp}:3001/api/tickets`;
const USERS_API_URL = `http://${localIp}:3001/api/users`;

class TicketDatabaseAPI {
    async createTicket(ticketData) {
        // Gera ticketNumber (simples, pode ser melhorado no backend)
        ticketData.ticketNumber = 'TK' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        ticketData.status = 'Aberto';
        ticketData.priority = 'Média';
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticketData)
        });
        if (!res.ok) throw new Error('Erro ao criar ticket');
        return await res.json();
    }

    async getAllTickets() {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Erro ao buscar tickets');
        return await res.json();
    }

    async getTicketById(id) {
        const res = await fetch(`${API_URL}/${id}`);
        if (!res.ok) throw new Error('Erro ao buscar ticket');
        return await res.json();
    }

    async updateTicket(id, updates) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Erro ao atualizar ticket');
        return await res.json();
    }

    async deleteTicket(id) {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Erro ao deletar ticket');
        return await res.json();
    }

    async getStatistics() {
        const res = await fetch(`${API_URL}/statistics`);
        if (!res.ok) throw new Error('Erro ao buscar estatísticas');
        return await res.json();
    }
    
    // Métodos para Anotações
    async getAnnotations(ticketId) {
        const res = await fetch(`${API_URL}/${ticketId}/annotations`);
        if (!res.ok) throw new Error('Erro ao buscar anotações');
        return await res.json();
    }

    async addAnnotation(ticketId, text, user) {
        const res = await fetch(`${API_URL}/${ticketId}/annotations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, user })
        });
        if (!res.ok) throw new Error('Erro ao adicionar anotação');
        return await res.json();
    }

    async deleteAnnotation(ticketId, annotationId) {
        const res = await fetch(`${API_URL}/${ticketId}/annotations/${annotationId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Erro ao excluir anotação');
        return await res.json();
    }
    
    // Método para upload de arquivos
    async uploadFile(ticketId, file, user) {
        const formData = new FormData();
        formData.append('file', file);
        if (user) formData.append('user', user);
        const res = await fetch(`${API_URL}/${ticketId}/attachments`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) throw new Error('Erro ao fazer upload do arquivo');
        return await res.json();
    }
    // Métodos para gerenciamento de usuários
    async getAllUsers() {
        const res = await fetch(USERS_API_URL);
        if (!res.ok) throw new Error('Erro ao buscar usuários');
        return await res.json();
    }
    
    async getUserById(id) {
        const res = await fetch(`${USERS_API_URL}/${id}`);
        if (!res.ok) throw new Error('Erro ao buscar usuário');
        return await res.json();
    }
    
    async createUser(userData) {
        const res = await fetch(USERS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!res.ok) throw new Error('Erro ao criar usuário');
        return await res.json();
    }
    
    async updateUser(id, updates) {
        const res = await fetch(`${USERS_API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Erro ao atualizar usuário');
        return await res.json();
    }
    
    async deleteUser(id) {
        const res = await fetch(`${USERS_API_URL}/${id}`, { 
            method: 'DELETE' 
        });
        if (!res.ok) throw new Error('Erro ao deletar usuário');
        return await res.json();
    }
}

window.ticketDB = new TicketDatabaseAPI();

// Função para verificar status do banco
window.checkDbStatus = async function() {
    try {
        await window.ticketDB.getAllTickets();
        const icon = document.getElementById('dbStatusIcon');
        if (icon) icon.style.background = '#63dc26'; // verde
    } catch {
        const icon = document.getElementById('dbStatusIcon');
        if (icon) icon.style.background = '#6b7280'; // cinza
    }
};
window.addEventListener('DOMContentLoaded', window.checkDbStatus);