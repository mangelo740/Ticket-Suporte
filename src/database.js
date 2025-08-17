// Simulação de banco SQLite usando localStorage
class TicketDatabase {
    constructor() {
        this.dbName = 'ticketSystem';
        this.initDatabase();
    }

    initDatabase() {
        if (!localStorage.getItem(this.dbName)) {
            const initialData = {
                tickets: [],
                nextId: 1,
                settings: {
                    version: '1.0.0',
                    created: new Date().toISOString()
                }
            };
            localStorage.setItem(this.dbName, JSON.stringify(initialData));
        }
    }

    getDatabase() {
        return JSON.parse(localStorage.getItem(this.dbName) || '{}');
    }

    saveDatabase(data) {
        localStorage.setItem(this.dbName, JSON.stringify(data));
    }

    // CREATE - Criar novo ticket
    createTicket(ticketData) {
        const db = this.getDatabase();
        const newTicket = {
            id: db.nextId.toString(),
            ticketNumber: `TK${db.nextId.toString().padStart(4, '0')}`,
            firstName: ticketData.firstName,
            lastName: ticketData.lastName,
            department: ticketData.department,
            destinationArea: ticketData.destinationArea,
            description: ticketData.description,
            contact: ticketData.contact || '',
            files: ticketData.files || [],
            status: 'Aberto',
            priority: 'Média',
            notes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        db.tickets.push(newTicket);
        db.nextId++;
        this.saveDatabase(db);
        
        return newTicket.ticketNumber;
    }

    // READ - Buscar todos os tickets
    getAllTickets() {
        const db = this.getDatabase();
        return db.tickets || [];
    }

    // READ - Buscar ticket por ID
    getTicketById(id) {
        const db = this.getDatabase();
        return db.tickets.find(ticket => ticket.id === id) || null;
    }

    // READ - Buscar tickets por status
    getTicketsByStatus(status) {
        const db = this.getDatabase();
        return db.tickets.filter(ticket => ticket.status === status);
    }

    // READ - Buscar tickets por prioridade
    getTicketsByPriority(priority) {
        const db = this.getDatabase();
        return db.tickets.filter(ticket => ticket.priority === priority);
    }

    // UPDATE - Atualizar ticket
    updateTicket(id, updates) {
        const db = this.getDatabase();
        const ticketIndex = db.tickets.findIndex(ticket => ticket.id === id);
        
        if (ticketIndex === -1) {
            return false;
        }

        db.tickets[ticketIndex] = {
            ...db.tickets[ticketIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.saveDatabase(db);
        return true;
    }

    // UPDATE - Adicionar nota ao ticket
    addNoteToTicket(id, note) {
        const db = this.getDatabase();
        const ticket = db.tickets.find(ticket => ticket.id === id);
        
        if (!ticket) {
            return false;
        }

        const newNote = {
            id: Date.now().toString(),
            text: note,
            createdAt: new Date().toISOString()
        };

        ticket.notes = ticket.notes || [];
        ticket.notes.push(newNote);
        ticket.updatedAt = new Date().toISOString();

        this.saveDatabase(db);
        return true;
    }

    // DELETE - Deletar ticket
    deleteTicket(id) {
        const db = this.getDatabase();
        const ticketIndex = db.tickets.findIndex(ticket => ticket.id === id);
        
        if (ticketIndex === -1) {
            return false;
        }

        db.tickets.splice(ticketIndex, 1);
        this.saveDatabase(db);
        return true;
    }

    // ANALYTICS - Estatísticas
    getStatistics() {
        const tickets = this.getAllTickets();
        
        const stats = {
            total: tickets.length,
            byStatus: {
                'Aberto': 0,
                'Em Andamento': 0,
                'Resolvido': 0,
                'Fechado': 0
            },
            byPriority: {
                'Crítica': 0,
                'Alta': 0,
                'Média': 0,
                'Baixa': 0
            }
        };

        tickets.forEach(ticket => {
            stats.byStatus[ticket.status] = (stats.byStatus[ticket.status] || 0) + 1;
            stats.byPriority[ticket.priority] = (stats.byPriority[ticket.priority] || 0) + 1;
        });

        return stats;
    }

    // SEARCH - Pesquisar tickets
    searchTickets(query) {
        const tickets = this.getAllTickets();
        const searchTerm = query.toLowerCase();
        
        return tickets.filter(ticket => 
            ticket.ticketNumber.toLowerCase().includes(searchTerm) ||
            ticket.firstName.toLowerCase().includes(searchTerm) ||
            ticket.lastName.toLowerCase().includes(searchTerm) ||
            ticket.department.toLowerCase().includes(searchTerm) ||
            ticket.destinationArea.toLowerCase().includes(searchTerm) ||
            ticket.description.toLowerCase().includes(searchTerm)
        );
    }

    // FILTER - Filtrar tickets
    filterTickets(filters) {
        let tickets = this.getAllTickets();

        if (filters.status && filters.status !== 'all') {
            tickets = tickets.filter(ticket => ticket.status === filters.status);
        }

        if (filters.priority && filters.priority !== 'all') {
            tickets = tickets.filter(ticket => ticket.priority === filters.priority);
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            tickets = tickets.filter(ticket => 
                ticket.ticketNumber.toLowerCase().includes(searchTerm) ||
                ticket.firstName.toLowerCase().includes(searchTerm) ||
                ticket.lastName.toLowerCase().includes(searchTerm) ||
                ticket.department.toLowerCase().includes(searchTerm) ||
                ticket.destinationArea.toLowerCase().includes(searchTerm) ||
                ticket.description.toLowerCase().includes(searchTerm)
            );
        }

        return tickets;
    }

    // UTILITY - Limpar banco de dados
    clearDatabase() {
        localStorage.removeItem(this.dbName);
        this.initDatabase();
    }

    // UTILITY - Exportar dados
    exportData() {
        return this.getDatabase();
    }

    // UTILITY - Importar dados
    importData(data) {
        this.saveDatabase(data);
    }
}

// Instância global do banco de dados
const ticketDB = new TicketDatabase();