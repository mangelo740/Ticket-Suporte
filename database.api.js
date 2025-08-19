const API_URL = 'http://localhost:3001/api/tickets';

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
loadDashboard();