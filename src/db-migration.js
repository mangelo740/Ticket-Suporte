/**
 * Script para migrar dados do localStorage para o SQLite
 * Este script pode ser executado para transferir chamados existentes
 */

const TicketDatabase = require('./db/database');
const fs = require('fs');
const path = require('path');

// Função para migrar dados do arquivo JSON (simulando localStorage)
async function migrateFromJson(jsonFilePath) {
    try {
        // Verificar se o arquivo existe
        if (!fs.existsSync(jsonFilePath)) {
            console.error(`Arquivo de origem não encontrado: ${jsonFilePath}`);
            return false;
        }

        // Ler dados do arquivo JSON
        const rawData = fs.readFileSync(jsonFilePath);
        const data = JSON.parse(rawData);

        // Inicializar banco de dados SQLite
        const ticketDB = new TicketDatabase();
        
        // Limpar banco de dados existente
        ticketDB.clearDatabase();
        console.log('Banco de dados limpo para migração');
        
        // Migrar tickets
        if (data.tickets && Array.isArray(data.tickets)) {
            console.log(`Encontrados ${data.tickets.length} tickets para migrar`);
            
            let migratedCount = 0;
            for (const ticket of data.tickets) {
                try {
                    // Criar ticket com os dados existentes
                    const ticketData = {
                        firstName: ticket.firstName,
                        lastName: ticket.lastName,
                        department: ticket.department,
                        destinationArea: ticket.destinationArea,
                        description: ticket.description,
                        contact: ticket.contact || '',
                        files: ticket.files || [],
                        status: ticket.status || 'Aberto',
                        priority: ticket.priority || 'Média',
                        createdAt: ticket.createdAt || new Date().toISOString(),
                        updatedAt: ticket.updatedAt || new Date().toISOString()
                    };
                    
                    // Inserir no SQLite
                    const ticketNumber = ticketDB.createTicket(ticketData);
                    
                    // Migrar notas se existirem
                    if (ticket.notes && Array.isArray(ticket.notes)) {
                        for (const note of ticket.notes) {
                            ticketDB.addNoteToTicket(ticket.id, note.text);
                        }
                    }
                    
                    migratedCount++;
                    console.log(`Ticket ${ticketNumber} migrado com sucesso`);
                } catch (err) {
                    console.error(`Erro ao migrar ticket ${ticket.id || 'desconhecido'}:`, err);
                }
            }
            
            console.log(`Migração concluída. ${migratedCount} de ${data.tickets.length} tickets migrados com sucesso.`);
        } else {
            console.log('Nenhum ticket encontrado para migrar');
        }
        
        // Atualizar o nextId se existir
        if (data.nextId) {
            console.log(`Configurando nextId para ${data.nextId}`);
            ticketDB.db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(data.nextId.toString(), 'nextId');
        }
        
        // Fechar conexão com banco de dados
        ticketDB.close();
        
        return true;
    } catch (error) {
        console.error('Erro durante a migração:', error);
        return false;
    }
}

// Executar migração se chamado diretamente
if (require.main === module) {
    const jsonFilePath = path.join(__dirname, '../data/tickets.json');
    console.log(`Iniciando migração de dados de ${jsonFilePath}`);
    
    migrateFromJson(jsonFilePath)
        .then(success => {
            if (success) {
                console.log('Migração concluída com sucesso!');
            } else {
                console.error('Migração falhou!');
            }
        })
        .catch(err => {
            console.error('Erro durante execução da migração:', err);
        });
}

module.exports = { migrateFromJson };