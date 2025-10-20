const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const dayjs = require('dayjs');
const multer = require('multer');
require('dayjs/plugin/utc');
require('dayjs/plugin/timezone');
dayjs.extend(require('dayjs/plugin/utc'));
dayjs.extend(require('dayjs/plugin/timezone'));

const PORT_SITE = process.env.PORT_SITE || 3030;
const PORT_API = process.env.PORT_API || 3001;

const app = express();
app.use(express.json({ limit: '1mb' })); // Limite pequeno para evitar uploads grandes via JSON

const corsOptions = {
    origin: '*', // ou coloque o endereço do frontend, ex: 'http://10.3.0.133:5500'
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use('/public', express.static('public'));
app.use('/uploads', express.static('uploads'));

// Middleware de logging para diagnóstico de rede (mostra IP remoto e headers importantes)
app.use((req, res, next) => {
    const remote = req.ip || req.socket.remoteAddress || req.connection.remoteAddress;
    console.log(`[REQ] ${new Date().toISOString()} - ${remote} - ${req.method} ${req.originalUrl} - Host: ${req.headers.host}`);
    next();
});

// Rota de healthcheck para testes remotos
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Conexão com o banco
const db = new sqlite3.Database('./tickets.db');

// Cria tabelas se não existirem
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

// Tabela de departamentos
db.run(`
    CREATE TABLE IF NOT EXISTS department (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        critico INTEGER,
        alto INTEGER,
        media INTEGER,
        baixa INTEGER,
        createdAt TEXT,
        updatedAt TEXT
    )
`);
// Verifica se as colunas createdAt e updatedAt existem (caso a tabela tenha sido criada antes sem elas)
db.all("PRAGMA table_info(department)", (err, cols) => {
    if (err) {
        console.error('Erro ao verificar colunas da tabela department:', err);
        return;
    }
    const names = cols.map(c => c.name);
    const tasks = [];
    if (!names.includes('createdAt')) {
        tasks.push(new Promise((resolve) => {
            db.run('ALTER TABLE department ADD COLUMN createdAt TEXT', (e) => {
                if (e) console.error('Erro ao adicionar coluna createdAt:', e);
                else console.log('Coluna createdAt adicionada à tabela department');
                resolve();
            });
        }));
    }
    if (!names.includes('updatedAt')) {
        tasks.push(new Promise((resolve) => {
            db.run('ALTER TABLE department ADD COLUMN updatedAt TEXT', (e) => {
                if (e) console.error('Erro ao adicionar coluna updatedAt:', e);
                else console.log('Coluna updatedAt adicionada à tabela department');
                resolve();
            });
        }));
    }
    if (tasks.length > 0) Promise.all(tasks).then(() => console.log('Migração de colunas department finalizada'));
});
// Rotas de departamentos

// Listar departamentos
app.get('/api/departments', (req, res) => {
    db.all('SELECT * FROM department ORDER BY name', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Listar departamentos
app.get('/api/departments', (req, res) => {
    console.log('[GET] /api/departments');
    db.all('SELECT * FROM department ORDER BY name', (err, rows) => {
        if (err) {
            console.error('Erro ao listar departamentos:', err);
            return res.status(500).json({ error: 'Erro ao listar departamentos' });
        }
        res.json(rows);
    });
});


// Adicionar departamento
app.post('/api/departments', (req, res) => {
    console.log('[POST] /api/departments - body:', req.body);
    // Aceita tanto os campos antigos quanto os novos do frontend
    const name = req.body.name;
    const critico = req.body.critico ?? req.body.criticality1 ?? req.body.criticality ?? req.body.critical ?? req.body.criticality_1;
    const alto = req.body.alto ?? req.body.criticality2 ?? req.body.criticality_2;
    const media = req.body.media ?? req.body.criticality3 ?? req.body.criticality_3;
    const baixa = req.body.baixa ?? req.body.criticality4 ?? req.body.criticality_4;
    if (!name) {
        console.warn('Tentativa de cadastro sem nome');
        return res.status(400).json({ error: 'Nome obrigatório' });
    }
    const now = new Date().toISOString();
    console.log('Valores para inserção:', { name, critico, alto, media, baixa });
    db.run(
        'INSERT INTO department (name, critico, alto, media, baixa, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, critico, alto, media, baixa, now, now],
        function(err) {
            if (err) {
                console.error('Erro ao inserir departamento:', err);
                return res.status(500).json({ error: err.message });
            }
            console.log('Departamento cadastrado com sucesso:', { id: this.lastID, name, critico, alto, media, baixa });
            res.json({ id: this.lastID, name, critico, alto, media, baixa, createdAt: now, updatedAt: now });
        }
    );
});

// Editar departamento
app.put('/api/departments/:id', (req, res) => {
    console.log('[PUT] /api/departments/' + req.params.id, req.body);
    const id = req.params.id;
    const name = req.body.name;
    const critico = req.body.critico ?? req.body.criticality1 ?? req.body.criticality ?? req.body.critical ?? req.body.criticality_1;
    const alto = req.body.alto ?? req.body.criticality2 ?? req.body.criticality_2;
    const media = req.body.media ?? req.body.criticality3 ?? req.body.criticality_3;
    const baixa = req.body.baixa ?? req.body.criticality4 ?? req.body.criticality_4;
    if (!name) {
        console.warn('Tentativa de edição sem nome');
        return res.status(400).json({ error: 'Nome obrigatório' });
    }
    const now = new Date().toISOString();
    console.log('Valores para update:', { name, critico, alto, media, baixa });
    db.run(
        'UPDATE department SET name = ?, critico = ?, alto = ?, media = ?, baixa = ?, updatedAt = ? WHERE id = ?',
        [name, critico, alto, media, baixa, now, id],
        function(err) {
            if (err) {
                console.error('Erro ao editar departamento:', err);
                return res.status(500).json({ error: err.message });
            }
            console.log('Departamento editado com sucesso:', { id, name, critico, alto, media, baixa });
            res.json({ id, name, critico, alto, media, baixa, updatedAt: now });
        }
    );
});

// Excluir departamento
app.delete('/api/departments/:id', (req, res) => {
    const id = req.params.id;
    console.log('[DELETE] /api/departments/' + id);
    db.run('DELETE FROM department WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Erro ao excluir departamento:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log('Departamento excluído com sucesso:', id);
        res.json({ success: true });
    });
});

// Criar tabela de anotações
db.run(`
    CREATE TABLE IF NOT EXISTS annotations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticketId INTEGER,
        text TEXT,
        user TEXT,
        createdAt TEXT,
        FOREIGN KEY (ticketId) REFERENCES tickets (id)
    )
`);

// Criar tabela de usuários
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        area TEXT NOT NULL,
        password TEXT NOT NULL,
        createdAt TEXT NOT NULL
    )
`);

const path = require('path');
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
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

    // Primeiro insere sem ticketNumber
    db.run(`
        INSERT INTO tickets (
            firstName, priority, department, destinationArea, subject, description, contact, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        t.firstName,
        t.priority || 'Média',
        t.department,
        t.destinationArea,
        t.subject,
        t.description,
        t.contact,
        t.status || 'Aberto',
        nowBR,
        nowBR
    ], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const id = this.lastID;
        const ticketNumber = 'TK' + String(id).padStart(4, '0');
        // Atualiza ticketNumber
        db.run('UPDATE tickets SET ticketNumber = ? WHERE id = ?', [ticketNumber, id], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ id, ticketNumber });
        });
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
        'firstName', 'status', 'priority',
        'department', 'destinationArea', 'subject',
        'description', 'notes', 'contact'
    ];

    const fields = [];
    const values = [];
    
    // Verificar se o status está sendo atualizado para Resolvido ou Fechado
    const isClosing = updates.status === 'Resolvido' || updates.status === 'Fechado';
    
    for (const key of validFields) {
        if (updates[key] !== undefined) {
            fields.push(`${key} = ?`);
            values.push(updates[key]);
        }
    }
    
    // Sempre atualizar o timestamp de atualização
    fields.push('updatedAt = ?');
    values.push(nowBR);
    
    // Se estiver fechando o ticket, adicionar o timestamp de fechamento
    if (isClosing) {
        fields.push('closedAt = ?');
        values.push(nowBR);
    }
    
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
    const filePath = path.join('uploads', req.file.filename);
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
            
            // Criar uma anotação sobre o upload de arquivo
            const nowBR = dayjs().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');
            const text = `Arquivo anexado: ${originalName}`;
            let user = req.body.user || "Sistema";

            db.run('INSERT INTO annotations (ticketId, text, user, createdAt) VALUES (?, ?, ?, ?)', 
                [ticketId, text, user, nowBR], 
                (err) => {
                    if (err) console.error('Erro ao registrar anotação:', err);
                }
            );
            
            res.json({ 
                filename: req.file.filename, 
                originalname: req.file.originalname, 
                path: filePath 
            });
        });
    });
});

// API para Anotações (annotations)

// Listar anotações de um chamado
app.get('/api/tickets/:id/annotations', (req, res) => {
    const ticketId = req.params.id;
    db.all('SELECT * FROM annotations WHERE ticketId = ? ORDER BY createdAt DESC', [ticketId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Criar nova anotação
app.post('/api/tickets/:id/annotations', (req, res) => {
    const ticketId = req.params.id;
    const { text, user } = req.body;
    const nowBR = dayjs().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');
    
    if (!text) return res.status(400).json({ error: 'O texto da anotação é obrigatório.' });
    
    db.run('INSERT INTO annotations (ticketId, text, user, createdAt) VALUES (?, ?, ?, ?)', 
        [ticketId, text, user || 'Anônimo', nowBR], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Atualizar data de atualização do ticket
            db.run('UPDATE tickets SET updatedAt = ? WHERE id = ?', [nowBR, ticketId]);
            
            res.json({ 
                id: this.lastID, 
                ticketId, 
                text, 
                user: user || 'Anônimo', 
                createdAt: nowBR 
            });
        }
    );
});

// Deletar uma anotação
app.delete('/api/tickets/:ticketId/annotations/:annotationId', (req, res) => {
    const { ticketId, annotationId } = req.params;
    
    db.run('DELETE FROM annotations WHERE id = ? AND ticketId = ?', 
        [annotationId, ticketId], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Anotação não encontrada.' });
            res.json({ deleted: this.changes });
        }
    );
});

// API para Usuários

// Listar todos os usuários
app.get('/api/users', (req, res) => {
    db.all('SELECT * FROM users ORDER BY name', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Buscar usuário por ID
app.get('/api/users/:id', (req, res) => {
    db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json(row);
    });
});

// Criar novo usuário
app.post('/api/users', (req, res) => {
    const { name, area, password } = req.body;
    const nowBR = dayjs().tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');
    
    // Validações básicas
    if (!name || !area || !password) {
        return res.status(400).json({ error: 'Nome, Área e Senha são campos obrigatórios' });
    }
    
    // Simples hash para a senha (em produção, usar bcrypt ou método similar)
    const crypto = require('crypto');
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    db.run('INSERT INTO users (name, area, password, whatsapp, createdAt) VALUES (?, ?, ?, ?, ?)',
        [name, area, hashedPassword, req.body.whatsapp, nowBR],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                id: this.lastID,
                name,
                area,
                whatsapp: req.body.whatsapp,
                createdAt: nowBR
                // Não retornamos a senha, mesmo hasheada
            });
        }
    );
});

// Atualizar usuário
app.put('/api/users/:id', (req, res) => {
    const { name, area, password } = req.body;
    const { id } = req.params;
    
    // Validações básicas
    if (!name && !area && !password) {
        return res.status(400).json({ error: 'É necessário fornecer ao menos um campo para atualização' });
    }
    
    let sql = 'UPDATE users SET ';
    const params = [];
    let fieldCount = 0;
    
    if (name) {
        sql += 'name = ?';
        params.push(name);
        fieldCount++;
    }
    
    if (area) {
        if (fieldCount > 0) sql += ', ';
        sql += 'area = ?';
        params.push(area);
        fieldCount++;
    }
    
    if (password) {
        if (fieldCount > 0) sql += ', ';
        // Hash da senha
        const crypto = require('crypto');
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        sql += 'password = ?';
        params.push(hashedPassword);
    }
    
    sql += ' WHERE id = ?';
    params.push(id);
    
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(row);
        });
    });
});

// Deletar usuário
app.delete('/api/users/:id', (req, res) => {
    db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({ deleted: true, id: req.params.id });
    });
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start servers: API port and optional site port
const { exec } = require('child_process');

// Helper to open URL in Windows
function tryOpenUrl(url) {
    try {
        exec(`start "" "${url}"`, (error) => {
            if (error) console.warn('Não foi possível abrir o navegador automaticamente:', error.message);
        });
    } catch (e) {
        console.warn('Erro ao tentar abrir navegador automaticamente:', e && e.message ? e.message : e);
    }
}

// Start API listener (bind 0.0.0.0 to accept network connections)
const apiServer = app.listen(PORT_API, '0.0.0.0', () => {
    console.log(`API rodando em http://0.0.0.0:${PORT_API}`);
});

// If PORT_SITE differs, also start listener for site (static files) so you can access via :3030
let siteServer = null;
if (PORT_SITE && Number(PORT_SITE) !== Number(PORT_API)) {
    siteServer = app.listen(PORT_SITE, '0.0.0.0', () => {
        console.log(`Site rodando em http://0.0.0.0:${PORT_SITE}/public/index.html`);
        // Abrir a página do site localmente
        tryOpenUrl(`http://127.0.0.1:${PORT_SITE}/public/index.html`);
    });
} else {
    // if ports are same, open API/site URL
    tryOpenUrl(`http://127.0.0.1:${PORT_API}/public/index.html`);
}
