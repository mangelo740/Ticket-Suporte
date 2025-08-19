const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Conexão com o banco
const db = new sqlite3.Database('./tickets.db');

// Cria tabela se não existir
db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticketNumber TEXT,
        firstName TEXT,
        lastName TEXT,
        department TEXT,
        destinationArea TEXT,
        subject TEXT,
        description TEXT,
        contact TEXT,
        status TEXT,
        priority TEXT,
        createdAt TEXT,
        updatedAt TEXT
    )
`);

// Criar novo chamado
app.post('/api/tickets', (req, res) => {
    const t = req.body;
    db.run(`
        INSERT INTO tickets (
            ticketNumber, firstName, lastName, department, destinationArea, subject, description, contact, status, priority, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        t.ticketNumber, t.firstName, t.lastName, t.department, t.destinationArea, t.subject, t.description, t.contact, t.status || 'Aberto', t.priority || 'Média', new Date().toISOString(), new Date().toISOString()
    ], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ticketNumber: t.ticketNumber });
    });
});

// Listar chamados
app.get('/api/tickets', (req, res) => {
    db.all('SELECT * FROM tickets', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Buscar chamado por ID
app.get('/api/tickets/:id', (req, res) => {
    db.get('SELECT * FROM tickets WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

// Atualizar chamado
app.put('/api/tickets/:id', (req, res) => {
    const id = req.params.id;
    const updates = req.body;

    // Monta dinamicamente o SET do SQL apenas com os campos enviados
    const fields = [];
    const values = [];
    for (const key in updates) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
    }
    values.push(id);

    if (fields.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    db.run(
        `UPDATE tickets SET ${fields.join(', ')}, updatedAt = datetime('now') WHERE id = ?`,
        values,
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            db.get('SELECT * FROM tickets WHERE id = ?', [id], (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(row);
            });
        }
    );
});

// Deletar chamado
app.delete('/api/tickets/:id', (req, res) => {
    db.run('DELETE FROM tickets WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

app.listen(3001, () => console.log('API rodando em http://localhost:3001'));