const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

class TicketDatabase {
    constructor() {
        this.dbFolder = path.join(__dirname, '../../db');
        this.dbPath = path.join(this.dbFolder, 'tickets.db');
        this.db = null;
        this.initDatabase();
    }

    initDatabase() {
        // Ensure the database folder exists
        if (!fs.existsSync(this.dbFolder)) {
            fs.mkdirSync(this.dbFolder, { recursive: true });
        }

        // Initialize database connection
        this.db = new Database(this.dbPath);
        
        // Create tables if they don't exist
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticketNumber TEXT NOT NULL UNIQUE,
                firstName TEXT NOT NULL,
                lastName TEXT NOT NULL,
                department TEXT NOT NULL,
                destinationArea TEXT NOT NULL,
                description TEXT NOT NULL,
                contact TEXT,
                status TEXT NOT NULL DEFAULT 'Aberto',
                priority TEXT NOT NULL DEFAULT 'Média',
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticketId INTEGER NOT NULL,
                text TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                FOREIGN KEY (ticketId) REFERENCES tickets (id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticketId INTEGER NOT NULL,
                name TEXT NOT NULL,
                size INTEGER NOT NULL,
                type TEXT NOT NULL,
                data TEXT NOT NULL,
                FOREIGN KEY (ticketId) REFERENCES tickets (id) ON DELETE CASCADE
            );
            
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT NOT NULL UNIQUE,
                value TEXT NOT NULL
            );
        `);

        // Check if nextId setting exists, if not create it
        const nextIdSetting = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('nextId');
        if (!nextIdSetting) {
            this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('nextId', '1');
        }

        console.log('Database initialized successfully!');
    }

    // CREATE - Criar novo ticket
    createTicket(ticketData) {
        // Get the next ID
        const nextIdStmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
        const nextIdRow = nextIdStmt.get('nextId');
        const nextId = parseInt(nextIdRow.value);
        
        // Generate ticket number
        const ticketNumber = `TK${nextId.toString().padStart(4, '0')}`;
        
        // Current time
        const now = new Date().toISOString();
        
        // Begin transaction
        const transaction = this.db.transaction((ticketData, nextId, ticketNumber, now) => {
            // Insert ticket
            const insertTicket = this.db.prepare(`
                INSERT INTO tickets 
                (ticketNumber, firstName, lastName, department, destinationArea, description, contact, status, priority, createdAt, updatedAt) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            const ticketResult = insertTicket.run(
                ticketNumber,
                ticketData.firstName,
                ticketData.lastName,
                ticketData.department,
                ticketData.destinationArea,
                ticketData.description,
                ticketData.contact || '',
                'Aberto',
                'Média',
                now,
                now
            );
            
            const ticketId = ticketResult.lastInsertRowid;
            
            // Insert files if any
            if (ticketData.files && ticketData.files.length > 0) {
                const insertFile = this.db.prepare(`
                    INSERT INTO files (ticketId, name, size, type, data)
                    VALUES (?, ?, ?, ?, ?)
                `);
                
                for (const file of ticketData.files) {
                    insertFile.run(
                        ticketId,
                        file.name,
                        file.size,
                        file.type,
                        file.data
                    );
                }
            }
            
            // Update next ID
            const updateNextId = this.db.prepare('UPDATE settings SET value = ? WHERE key = ?');
            updateNextId.run((nextId + 1).toString(), 'nextId');
            
            return ticketNumber;
        });
        
        // Execute transaction
        return transaction(ticketData, nextId, ticketNumber, now);
    }

    // READ - Buscar todos os tickets
    getAllTickets() {
        const tickets = this.db.prepare(`
            SELECT 
                id, ticketNumber, firstName, lastName, department, destinationArea, 
                description, contact, status, priority, createdAt, updatedAt 
            FROM tickets
            ORDER BY createdAt DESC
        `).all();
        
        // For each ticket, get files and notes
        return tickets.map(ticket => this._enrichTicket(ticket));
    }

    // READ - Buscar ticket por ID
    getTicketById(id) {
        const ticket = this.db.prepare(`
            SELECT 
                id, ticketNumber, firstName, lastName, department, destinationArea, 
                description, contact, status, priority, createdAt, updatedAt 
            FROM tickets
            WHERE id = ?
        `).get(id);
        
        if (!ticket) return null;
        
        return this._enrichTicket(ticket);
    }

    // READ - Buscar ticket por Número
    getTicketByNumber(ticketNumber) {
        const ticket = this.db.prepare(`
            SELECT 
                id, ticketNumber, firstName, lastName, department, destinationArea, 
                description, contact, status, priority, createdAt, updatedAt 
            FROM tickets
            WHERE ticketNumber = ?
        `).get(ticketNumber);
        
        if (!ticket) return null;
        
        return this._enrichTicket(ticket);
    }

    // READ - Buscar tickets por status
    getTicketsByStatus(status) {
        const tickets = this.db.prepare(`
            SELECT 
                id, ticketNumber, firstName, lastName, department, destinationArea, 
                description, contact, status, priority, createdAt, updatedAt 
            FROM tickets
            WHERE status = ?
            ORDER BY createdAt DESC
        `).all(status);
        
        return tickets.map(ticket => this._enrichTicket(ticket));
    }

    // READ - Buscar tickets por prioridade
    getTicketsByPriority(priority) {
        const tickets = this.db.prepare(`
            SELECT 
                id, ticketNumber, firstName, lastName, department, destinationArea, 
                description, contact, status, priority, createdAt, updatedAt 
            FROM tickets
            WHERE priority = ?
            ORDER BY createdAt DESC
        `).all(priority);
        
        return tickets.map(ticket => this._enrichTicket(ticket));
    }

    // UPDATE - Atualizar ticket
    updateTicket(id, updates) {
        try {
            const now = new Date().toISOString();
            const allowedFields = ['firstName', 'lastName', 'department', 'destinationArea', 'description', 'contact', 'status', 'priority'];
            
            // Build update SQL based on provided fields
            const updateFields = [];
            const updateValues = [];
            
            for (const field of allowedFields) {
                if (updates[field] !== undefined) {
                    updateFields.push(`${field} = ?`);
                    updateValues.push(updates[field]);
                }
            }
            
            if (updateFields.length === 0) return false;
            
            // Add updatedAt
            updateFields.push('updatedAt = ?');
            updateValues.push(now);
            
            // Add id for WHERE clause
            updateValues.push(id);
            
            const updateSql = `
                UPDATE tickets 
                SET ${updateFields.join(', ')} 
                WHERE id = ?
            `;
            
            const result = this.db.prepare(updateSql).run(...updateValues);
            return result.changes > 0;
        } catch (error) {
            console.error('Error updating ticket:', error);
            return false;
        }
    }

    // UPDATE - Adicionar nota ao ticket
    addNoteToTicket(id, note) {
        try {
            const now = new Date().toISOString();
            
            const insertNote = this.db.prepare(`
                INSERT INTO notes (ticketId, text, createdAt)
                VALUES (?, ?, ?)
            `);
            
            const result = insertNote.run(id, note, now);
            
            // Update the ticket's updatedAt timestamp
            this.db.prepare('UPDATE tickets SET updatedAt = ? WHERE id = ?').run(now, id);
            
            return result.changes > 0;
        } catch (error) {
            console.error('Error adding note:', error);
            return false;
        }
    }

    // DELETE - Deletar ticket
    deleteTicket(id) {
        try {
            const transaction = this.db.transaction((id) => {
                // Delete the ticket and all associated data (notes and files will be deleted via CASCADE)
                const result = this.db.prepare('DELETE FROM tickets WHERE id = ?').run(id);
                return result.changes > 0;
            });
            
            return transaction(id);
        } catch (error) {
            console.error('Error deleting ticket:', error);
            return false;
        }
    }

    // ANALYTICS - Estatísticas
    getStatistics() {
        const totalTickets = this.db.prepare('SELECT COUNT(*) as count FROM tickets').get().count;
        
        const statusStats = this.db.prepare(`
            SELECT status, COUNT(*) as count 
            FROM tickets 
            GROUP BY status
        `).all();
        
        const priorityStats = this.db.prepare(`
            SELECT priority, COUNT(*) as count 
            FROM tickets 
            GROUP BY priority
        `).all();
        
        const byStatus = {
            'Aberto': 0,
            'Em Andamento': 0,
            'Resolvido': 0,
            'Fechado': 0
        };
        
        const byPriority = {
            'Crítica': 0,
            'Alta': 0,
            'Média': 0,
            'Baixa': 0
        };
        
        // Fill in the actual values
        statusStats.forEach(item => {
            byStatus[item.status] = item.count;
        });
        
        priorityStats.forEach(item => {
            byPriority[item.priority] = item.count;
        });
        
        return {
            total: totalTickets,
            byStatus,
            byPriority
        };
    }

    // SEARCH - Pesquisar tickets
    searchTickets(query) {
        const searchTerm = `%${query.toLowerCase()}%`;
        
        const tickets = this.db.prepare(`
            SELECT 
                id, ticketNumber, firstName, lastName, department, destinationArea, 
                description, contact, status, priority, createdAt, updatedAt 
            FROM tickets
            WHERE 
                LOWER(ticketNumber) LIKE ? OR
                LOWER(firstName) LIKE ? OR
                LOWER(lastName) LIKE ? OR
                LOWER(department) LIKE ? OR
                LOWER(destinationArea) LIKE ? OR
                LOWER(description) LIKE ?
            ORDER BY createdAt DESC
        `).all(
            searchTerm, 
            searchTerm, 
            searchTerm, 
            searchTerm, 
            searchTerm, 
            searchTerm
        );
        
        return tickets.map(ticket => this._enrichTicket(ticket));
    }

    // FILTER - Filtrar tickets
    filterTickets(filters) {
        let sql = `
            SELECT 
                id, ticketNumber, firstName, lastName, department, destinationArea, 
                description, contact, status, priority, createdAt, updatedAt 
            FROM tickets
            WHERE 1=1
        `;
        
        const params = [];
        
        // Status filter
        if (filters.status && filters.status !== 'all') {
            sql += ' AND status = ?';
            params.push(filters.status);
        }
        
        // Priority filter
        if (filters.priority && filters.priority !== 'all') {
            sql += ' AND priority = ?';
            params.push(filters.priority);
        }
        
        // Search filter
        if (filters.search) {
            const searchTerm = `%${filters.search.toLowerCase()}%`;
            sql += ` AND (
                LOWER(ticketNumber) LIKE ? OR
                LOWER(firstName) LIKE ? OR
                LOWER(lastName) LIKE ? OR
                LOWER(department) LIKE ? OR
                LOWER(destinationArea) LIKE ? OR
                LOWER(description) LIKE ?
            )`;
            params.push(
                searchTerm, 
                searchTerm, 
                searchTerm, 
                searchTerm, 
                searchTerm, 
                searchTerm
            );
        }
        
        sql += ' ORDER BY createdAt DESC';
        
        const tickets = this.db.prepare(sql).all(...params);
        return tickets.map(ticket => this._enrichTicket(ticket));
    }

    // Helper method to add files and notes to ticket object
    _enrichTicket(ticket) {
        // Get files
        const files = this.db.prepare(`
            SELECT id, name, size, type, data
            FROM files
            WHERE ticketId = ?
        `).all(ticket.id);
        
        // Get notes
        const notes = this.db.prepare(`
            SELECT id, text, createdAt
            FROM notes
            WHERE ticketId = ?
            ORDER BY createdAt DESC
        `).all(ticket.id);
        
        return {
            ...ticket,
            files,
            notes
        };
    }

    // UTILITY - Exportar dados
    exportData() {
        const tickets = this.getAllTickets();
        const settings = this.db.prepare('SELECT * FROM settings').all();
        
        return {
            tickets,
            settings
        };
    }

    // UTILITY - Limpar banco de dados
    clearDatabase() {
        const transaction = this.db.transaction(() => {
            this.db.prepare('DELETE FROM files').run();
            this.db.prepare('DELETE FROM notes').run();
            this.db.prepare('DELETE FROM tickets').run();
            this.db.prepare('UPDATE settings SET value = ? WHERE key = ?').run('1', 'nextId');
        });
        
        transaction();
        return true;
    }

    // Close database connection
    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = TicketDatabase;