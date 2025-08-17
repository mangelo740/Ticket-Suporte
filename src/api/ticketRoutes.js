const express = require('express');
const router = express.Router();
const TicketDatabase = require('../db/database');

// Create an instance of the database
const ticketDB = new TicketDatabase();

// Handle application shutdown
process.on('exit', () => {
    ticketDB.close();
});

// GET /api/tickets - Get all tickets
router.get('/tickets', (req, res) => {
    try {
        const tickets = ticketDB.getAllTickets();
        res.json(tickets);
    } catch (error) {
        console.error('Error getting tickets:', error);
        res.status(500).json({ error: 'Erro ao buscar tickets' });
    }
});

// GET /api/tickets/:id - Get a specific ticket
router.get('/tickets/:id', (req, res) => {
    try {
        const ticket = ticketDB.getTicketById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket não encontrado' });
        }
        res.json(ticket);
    } catch (error) {
        console.error('Error getting ticket:', error);
        res.status(500).json({ error: 'Erro ao buscar ticket' });
    }
});

// POST /api/tickets - Create a new ticket
router.post('/tickets', express.json({ limit: '50mb' }), (req, res) => {
    try {
        const ticketData = req.body;
        
        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'department', 'destinationArea', 'description'];
        for (const field of requiredFields) {
            if (!ticketData[field]) {
                return res.status(400).json({ error: `Campo obrigatório: ${field}` });
            }
        }
        
        const ticketNumber = ticketDB.createTicket(ticketData);
        res.status(201).json({ ticketNumber });
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Erro ao criar ticket' });
    }
});

// PUT /api/tickets/:id - Update a ticket
router.put('/tickets/:id', express.json(), (req, res) => {
    try {
        const updates = req.body;
        const result = ticketDB.updateTicket(req.params.id, updates);
        
        if (!result) {
            return res.status(404).json({ error: 'Ticket não encontrado ou nenhuma alteração realizada' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ error: 'Erro ao atualizar ticket' });
    }
});

// POST /api/tickets/:id/notes - Add a note to a ticket
router.post('/tickets/:id/notes', express.json(), (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Texto da nota é obrigatório' });
        }
        
        const result = ticketDB.addNoteToTicket(req.params.id, text);
        
        if (!result) {
            return res.status(404).json({ error: 'Ticket não encontrado' });
        }
        
        // Return the updated ticket
        const updatedTicket = ticketDB.getTicketById(req.params.id);
        res.status(201).json(updatedTicket);
    } catch (error) {
        console.error('Error adding note:', error);
        res.status(500).json({ error: 'Erro ao adicionar nota' });
    }
});

// DELETE /api/tickets/:id - Delete a ticket
router.delete('/tickets/:id', (req, res) => {
    try {
        const result = ticketDB.deleteTicket(req.params.id);
        
        if (!result) {
            return res.status(404).json({ error: 'Ticket não encontrado' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting ticket:', error);
        res.status(500).json({ error: 'Erro ao deletar ticket' });
    }
});

// GET /api/tickets/search/:query - Search tickets
router.get('/tickets/search/:query', (req, res) => {
    try {
        const tickets = ticketDB.searchTickets(req.params.query);
        res.json(tickets);
    } catch (error) {
        console.error('Error searching tickets:', error);
        res.status(500).json({ error: 'Erro ao pesquisar tickets' });
    }
});

// GET /api/tickets/filter - Filter tickets
router.get('/tickets/filter', (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            priority: req.query.priority,
            search: req.query.search
        };
        
        const tickets = ticketDB.filterTickets(filters);
        res.json(tickets);
    } catch (error) {
        console.error('Error filtering tickets:', error);
        res.status(500).json({ error: 'Erro ao filtrar tickets' });
    }
});

// GET /api/statistics - Get ticket statistics
router.get('/statistics', (req, res) => {
    try {
        const statistics = ticketDB.getStatistics();
        res.json(statistics);
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

module.exports = router;