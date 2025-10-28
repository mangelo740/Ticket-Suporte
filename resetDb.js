const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./tickets.db');

db.serialize(() => {
  db.run('DELETE FROM tickets');
  db.run('DELETE FROM annotations');
  db.run()
  console.log('Chamados e anotações apagados. Usuários mantidos.');
});

db.close();