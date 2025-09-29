-- Smart Pallet Database Schema
-- Execute este script no SQL Editor do Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Contracts table
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('origem', 'destino', 'estoque')),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    contract_id UUID REFERENCES contracts(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SKUs table
CREATE TABLE skus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(50) NOT NULL,
    weight DECIMAL(10,3),
    dimensions VARCHAR(100),
    unit_price DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QR Tags table
CREATE TABLE qr_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'livre' CHECK (status IN ('livre', 'vinculado')),
    description TEXT,
    pallet_id VARCHAR(50), -- Changed to VARCHAR to match pallets.id
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pallets table
CREATE TABLE pallets (
    id VARCHAR(50) PRIMARY KEY, -- CTX-DDMMYYYYHHMMSS format
    qr_tag_id UUID NOT NULL REFERENCES qr_tags(id),
    contract_id UUID NOT NULL REFERENCES contracts(id),
    origin_location_id UUID NOT NULL REFERENCES locations(id),
    destination_location_id UUID REFERENCES locations(id),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'em_manifesto', 'em_transito', 'recebido', 'finalizado')),
    ai_confidence DECIMAL(5,2),
    requires_manual_review BOOLEAN DEFAULT FALSE,
    manifest_id UUID,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pallet Items table
CREATE TABLE pallet_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pallet_id VARCHAR(50) NOT NULL REFERENCES pallets(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES skus(id),
    quantity_origin INTEGER NOT NULL,
    quantity_destination INTEGER,
    manual_count_origin INTEGER,
    manual_count_destination INTEGER,
    ai_confidence DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pallet Photos table
CREATE TABLE pallet_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pallet_id VARCHAR(50) NOT NULL REFERENCES pallets(id) ON DELETE CASCADE,
    photo_type VARCHAR(20) NOT NULL CHECK (photo_type IN ('frontal', 'lateral', 'superior')),
    stage VARCHAR(20) NOT NULL CHECK (stage IN ('origem', 'destino')),
    file_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manifests table
CREATE TABLE manifests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manifest_number VARCHAR(100) UNIQUE NOT NULL,
    contract_id UUID NOT NULL REFERENCES contracts(id),
    origin_location_id UUID NOT NULL REFERENCES locations(id),
    destination_location_id UUID NOT NULL REFERENCES locations(id),
    status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'carregado', 'em_transito', 'entregue')),
    departure_date TIMESTAMPTZ,
    arrival_date TIMESTAMPTZ,
    driver_name VARCHAR(255),
    vehicle_plate VARCHAR(20),
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manifest Pallets junction table
CREATE TABLE manifest_pallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manifest_id UUID NOT NULL REFERENCES manifests(id) ON DELETE CASCADE,
    pallet_id VARCHAR(50) NOT NULL REFERENCES pallets(id),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(manifest_id, pallet_id)
);

-- Receipts table
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manifest_id UUID NOT NULL REFERENCES manifests(id),
    pallet_id VARCHAR(50) REFERENCES pallets(id),
    received_by VARCHAR(255) NOT NULL,
    received_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ok', 'alerta', 'critico')),
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comparisons table
CREATE TABLE comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    pallet_id VARCHAR(50) NOT NULL REFERENCES pallets(id),
    sku_id UUID NOT NULL REFERENCES skus(id),
    quantity_origin INTEGER NOT NULL,
    quantity_destination INTEGER NOT NULL,
    difference INTEGER NOT NULL,
    difference_type VARCHAR(20) NOT NULL CHECK (difference_type IN ('falta', 'sobra', 'avaria', 'troca')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint for pallet_id in qr_tags
ALTER TABLE qr_tags ADD CONSTRAINT fk_qr_tags_pallet 
    FOREIGN KEY (pallet_id) REFERENCES pallets(id) ON DELETE SET NULL;

-- Add foreign key constraint for manifest_id in pallets
ALTER TABLE pallets ADD CONSTRAINT fk_pallets_manifest 
    FOREIGN KEY (manifest_id) REFERENCES manifests(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_pallets_status ON pallets(status);
CREATE INDEX idx_pallets_contract ON pallets(contract_id);
CREATE INDEX idx_pallets_manifest ON pallets(manifest_id);
CREATE INDEX idx_qr_tags_status ON qr_tags(status);
CREATE INDEX idx_qr_tags_code ON qr_tags(qr_code);
CREATE INDEX idx_manifests_status ON manifests(status);
CREATE INDEX idx_receipts_manifest ON receipts(manifest_id);
CREATE INDEX idx_comparisons_receipt ON comparisons(receipt_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skus_updated_at BEFORE UPDATE ON skus 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_tags_updated_at BEFORE UPDATE ON qr_tags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pallets_updated_at BEFORE UPDATE ON pallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pallet_items_updated_at BEFORE UPDATE ON pallet_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manifests_updated_at BEFORE UPDATE ON manifests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON receipts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
