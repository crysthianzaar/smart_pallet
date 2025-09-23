import Database from 'better-sqlite3';
import path from 'path';

// Configuração do banco SQLite
const dbPath = path.join(process.cwd(), 'data', 'smartpallet.db');
const db = new Database(dbPath);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Schema do banco de dados
const initializeDatabase = () => {
  // Tabela de Contratos
  db.exec(`
    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      contact_email TEXT,
      contact_phone TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de Locais
  db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('origem', 'destino', 'estoque')),
      address TEXT,
      city TEXT,
      state TEXT,
      postal_code TEXT,
      contract_id TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id)
    )
  `);

  // Tabela de SKUs
  db.exec(`
    CREATE TABLE IF NOT EXISTS skus (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      unit TEXT DEFAULT 'un',
      weight REAL,
      dimensions TEXT,
      category TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de QR Tags
  db.exec(`
    CREATE TABLE IF NOT EXISTS qr_tags (
      id TEXT PRIMARY KEY,
      qr_code TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'livre' CHECK (status IN ('livre', 'vinculado')),
      current_pallet_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de Paletes
  db.exec(`
    CREATE TABLE IF NOT EXISTS pallets (
      id TEXT PRIMARY KEY,
      qr_tag_id TEXT NOT NULL,
      contract_id TEXT NOT NULL,
      origin_location_id TEXT NOT NULL,
      destination_location_id TEXT,
      status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'selado', 'em_transporte', 'recebido', 'cancelado')),
      ai_confidence REAL,
      requires_manual_review BOOLEAN DEFAULT FALSE,
      sealed_at DATETIME,
      sealed_by TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (qr_tag_id) REFERENCES qr_tags(id),
      FOREIGN KEY (contract_id) REFERENCES contracts(id),
      FOREIGN KEY (origin_location_id) REFERENCES locations(id),
      FOREIGN KEY (destination_location_id) REFERENCES locations(id)
    )
  `);

  // Tabela de Fotos dos Paletes
  db.exec(`
    CREATE TABLE IF NOT EXISTS pallet_photos (
      id TEXT PRIMARY KEY,
      pallet_id TEXT NOT NULL,
      photo_type TEXT NOT NULL CHECK (photo_type IN ('frontal', 'lateral', 'superior')),
      file_path TEXT NOT NULL,
      stage TEXT NOT NULL CHECK (stage IN ('origem', 'destino')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pallet_id) REFERENCES pallets(id)
    )
  `);

  // Tabela de Itens do Palete
  db.exec(`
    CREATE TABLE IF NOT EXISTS pallet_items (
      id TEXT PRIMARY KEY,
      pallet_id TEXT NOT NULL,
      sku_id TEXT NOT NULL,
      quantity_origin INTEGER NOT NULL DEFAULT 0,
      quantity_destination INTEGER DEFAULT 0,
      ai_suggested_quantity INTEGER DEFAULT 0,
      manual_count_origin INTEGER DEFAULT 0,
      manual_count_destination INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pallet_id) REFERENCES pallets(id),
      FOREIGN KEY (sku_id) REFERENCES skus(id)
    )
  `);

  // Tabela de Manifestos
  db.exec(`
    CREATE TABLE IF NOT EXISTS manifests (
      id TEXT PRIMARY KEY,
      manifest_number TEXT UNIQUE NOT NULL,
      contract_id TEXT NOT NULL,
      origin_location_id TEXT NOT NULL,
      destination_location_id TEXT NOT NULL,
      driver_name TEXT NOT NULL,
      vehicle_plate TEXT NOT NULL,
      status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'carregado', 'em_transito', 'entregue')),
      pdf_path TEXT,
      loaded_at DATETIME,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id),
      FOREIGN KEY (origin_location_id) REFERENCES locations(id),
      FOREIGN KEY (destination_location_id) REFERENCES locations(id)
    )
  `);

  // Tabela de Paletes no Manifesto
  db.exec(`
    CREATE TABLE IF NOT EXISTS manifest_pallets (
      id TEXT PRIMARY KEY,
      manifest_id TEXT NOT NULL,
      pallet_id TEXT NOT NULL,
      loaded_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (manifest_id) REFERENCES manifests(id),
      FOREIGN KEY (pallet_id) REFERENCES pallets(id)
    )
  `);

  // Tabela de Recebimentos
  db.exec(`
    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      pallet_id TEXT NOT NULL,
      manifest_id TEXT,
      location_id TEXT NOT NULL,
      received_by TEXT NOT NULL,
      ai_confidence REAL,
      status TEXT DEFAULT 'ok' CHECK (status IN ('ok', 'alerta', 'critico')),
      notes TEXT,
      received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pallet_id) REFERENCES pallets(id),
      FOREIGN KEY (manifest_id) REFERENCES manifests(id),
      FOREIGN KEY (location_id) REFERENCES locations(id)
    )
  `);

  // Tabela de Comparações/Diferenças
  db.exec(`
    CREATE TABLE IF NOT EXISTS comparisons (
      id TEXT PRIMARY KEY,
      receipt_id TEXT NOT NULL,
      pallet_id TEXT NOT NULL,
      sku_id TEXT NOT NULL,
      quantity_origin INTEGER NOT NULL,
      quantity_destination INTEGER NOT NULL,
      difference INTEGER NOT NULL,
      difference_type TEXT CHECK (difference_type IN ('falta', 'sobra', 'avaria', 'troca')),
      reason TEXT,
      evidence_photos TEXT, -- JSON array of photo paths
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id),
      FOREIGN KEY (pallet_id) REFERENCES pallets(id),
      FOREIGN KEY (sku_id) REFERENCES skus(id)
    )
  `);

  // Tabela de Auditoria
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      user_id TEXT NOT NULL,
      old_values TEXT, -- JSON
      new_values TEXT, -- JSON
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Índices para performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pallets_qr_tag ON pallets(qr_tag_id);
    CREATE INDEX IF NOT EXISTS idx_pallets_status ON pallets(status);
    CREATE INDEX IF NOT EXISTS idx_pallets_contract ON pallets(contract_id);
    CREATE INDEX IF NOT EXISTS idx_qr_tags_status ON qr_tags(status);
    CREATE INDEX IF NOT EXISTS idx_manifest_pallets_manifest ON manifest_pallets(manifest_id);
    CREATE INDEX IF NOT EXISTS idx_manifest_pallets_pallet ON manifest_pallets(pallet_id);
    CREATE INDEX IF NOT EXISTS idx_receipts_pallet ON receipts(pallet_id);
    CREATE INDEX IF NOT EXISTS idx_comparisons_receipt ON comparisons(receipt_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
  `);

  console.log('Database initialized successfully');
};

// Inicializar o banco na primeira execução
initializeDatabase();

export { db, initializeDatabase };
