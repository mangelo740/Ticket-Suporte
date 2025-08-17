const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const fs = require('fs');

// Import routes
const ticketRoutes = require('../src/api/ticketRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure db directory exists
const dbDir = path.join(__dirname, '../db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'cdnjs.cloudflare.com', "'unsafe-inline'"],
            styleSrc: ["'self'", 'cdnjs.cloudflare.com', "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
            fontSrc: ["'self'", 'cdnjs.cloudflare.com'],
            connectSrc: ["'self'"]
        }
    }
}));

// Body parser for JSON data
app.use(express.json({ limit: '50mb' }));

// Compression for better performance
app.use(compression());

// Serve static files
app.use(express.static(path.join(__dirname)));

// API routes
app.use('/api', ticketRoutes);

// Main routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Handle file download route
app.get('/api/tickets/:id/files/:fileIndex', (req, res) => {
    const TicketDatabase = require('../src/db/database');
    const ticketDB = new TicketDatabase();

    try {
        const ticket = ticketDB.getTicketById(req.params.id);
        
        if (!ticket || !ticket.files || !ticket.files[req.params.fileIndex]) {
            return res.status(404).json({ error: 'Arquivo não encontrado' });
        }
        
        const file = ticket.files[req.params.fileIndex];
        res.json(file);
        
    } catch (error) {
        console.error('Error retrieving file:', error);
        res.status(500).json({ error: 'Erro ao recuperar arquivo' });
    } finally {
        ticketDB.close();
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err);
    res.status(500).json({ 
        error: 'Erro interno no servidor',
        message: err.message 
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Encerrando servidor...');
    process.exit(0);
});