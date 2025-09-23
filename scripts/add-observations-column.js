const Database = require('better-sqlite3');
const path = require('path');

// Configuração do banco SQLite
const dbPath = path.join(process.cwd(), 'data', 'smartpallet.db');

console.log('🔧 Adicionando coluna observations à tabela pallets...');

try {
  const db = new Database(dbPath);
  
  // Verificar se a coluna já existe
  const tableInfo = db.prepare("PRAGMA table_info(pallets)").all();
  const hasObservations = tableInfo.some(column => column.name === 'observations');
  
  if (hasObservations) {
    console.log('✅ Coluna observations já existe na tabela pallets');
  } else {
    // Adicionar a coluna observations
    db.exec('ALTER TABLE pallets ADD COLUMN observations TEXT');
    console.log('✅ Coluna observations adicionada à tabela pallets');
  }
  
  db.close();
  console.log('🎉 Migração concluída com sucesso!');
  
} catch (error) {
  console.error('❌ Erro na migração:', error.message);
  process.exit(1);
}
