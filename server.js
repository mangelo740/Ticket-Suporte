const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const dayjs = require('dayjs');
const multer = require('multer');
require('dayjs/plugin/utc');
require('dayjs/plugin/timezone');
dayjs.extend(require('dayjs/plugin/utc'));
dayjs.extend(require('dayjs/plugin/timezone'));

const app = express();
app.use(express.json({ limit: '1mb' })); // Limite pequeno para evitar uploads grandes via JSON
const corsOptions = {
    origin: '*', // ou coloque o endereço do frontend, ex: 'http://10.3.0.133:5500'
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use('/uploads', express.static('uploads'));

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

const path = require('path');
const fs = require('fs');
const uploadDir = path.join(__dirname, 'Arquivos Chamados');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Gera nome único preservando extensão
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Criar novo chamado (sem arquivos)
app.post('/api/tickets', (req, res) => {
    const t = req.body;
    const nowBR = dayjs().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');

    db.run(`
        INSERT INTO tickets (
            ticketNumber, firstName, lastName, department, destinationArea, subject, description, contact, status, priority, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        t.ticketNumber, t.firstName, t.lastName, t.department, t.destinationArea, t.subject, t.description, t.contact, t.status || 'Aberto', t.priority || 'Média', nowBR, nowBR
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
    const nowBR = dayjs().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');

    // Lista de campos válidos conforme sua tabela
    const validFields = [
        'firstName', 'lastName', 'status', 'priority',
        'department', 'destinationArea', 'subject',
        'description', 'notes', 'contact'
    ];

    const fields = [];
    const values = [];
    for (const key of validFields) {
        if (updates[key] !== undefined) {
            fields.push(`${key} = ?`);
            values.push(updates[key]);
        }
    }
    fields.push('updatedAt = ?');
    values.push(nowBR);
    values.push(id);

    if (fields.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    db.run(
        `UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`,
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

// Upload de arquivo para um chamado
// Permitir múltiplos anexos por ticket
app.post('/api/tickets/:id/attachments', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    const ticketId = req.params.id;
    const filePath = path.join('Arquivos Chamados', req.file.filename);
    const originalName = req.file.originalname;
    // Busca anexos existentes
    db.get('SELECT attachments FROM tickets WHERE id = ?', [ticketId], (err, row) => {
        let attachments = [];
        if (row && row.attachments) {
            try {
                attachments = JSON.parse(row.attachments);
            } catch {
                attachments = [];
            }
        }
        attachments.push({ path: filePath, name: originalName });
        db.run('UPDATE tickets SET attachments = ? WHERE id = ?', [JSON.stringify(attachments), ticketId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ filename: req.file.filename, originalname: req.file.originalname, path: filePath });
        });
    });
});

app.use('/Arquivos Chamados', express.static(path.join(__dirname, 'Arquivos Chamados')));
app.listen(3001, () => console.log('API rodando em http://localhost:3001'));
