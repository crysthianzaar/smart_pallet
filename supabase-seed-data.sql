-- Dados de exemplo para testar o sistema
-- Execute após criar o schema

-- Inserir contratos de exemplo
INSERT INTO contracts (name, company, contact_email, contact_phone) VALUES
('Contrato Principal', 'Empresa ABC Ltda', 'contato@empresaabc.com', '(11) 9999-9999'),
('Contrato Secundário', 'Empresa XYZ S.A.', 'vendas@empresaxyz.com', '(11) 8888-8888');

-- Inserir localizações de exemplo
INSERT INTO locations (name, type, address, city, state, contract_id) VALUES
('Armazém Central - SP', 'origem', 'Rua das Indústrias, 100', 'São Paulo', 'SP', 
    (SELECT id FROM contracts WHERE name = 'Contrato Principal' LIMIT 1)),
('Centro de Distribuição - RJ', 'destino', 'Av. Brasil, 500', 'Rio de Janeiro', 'RJ', 
    (SELECT id FROM contracts WHERE name = 'Contrato Principal' LIMIT 1)),
('Depósito Norte', 'estoque', 'Rua do Comércio, 200', 'Belo Horizonte', 'MG', 
    (SELECT id FROM contracts WHERE name = 'Contrato Secundário' LIMIT 1));

-- Inserir SKUs de exemplo
INSERT INTO skus (code, name, description, unit, unit_price) VALUES
('PROD-001', 'Produto A Premium', 'Produto de alta qualidade linha premium', 'UN', 25.99),
('PROD-002', 'Produto B Standard', 'Produto padrão para uso geral', 'UN', 15.50),
('PROD-003', 'Produto C Econômico', 'Produto básico linha econômica', 'UN', 8.75),
('PROD-004', 'Kit Especial', 'Kit com múltiplos produtos', 'KIT', 45.00);

-- Inserir QR Tags de exemplo
INSERT INTO qr_tags (qr_code, description) VALUES
('QR001234567890', 'Tag QR para testes - 001'),
('QR001234567891', 'Tag QR para testes - 002'),
('QR001234567892', 'Tag QR para testes - 003'),
('QR001234567893', 'Tag QR para testes - 004'),
('QR001234567894', 'Tag QR para testes - 005');

-- Inserir um pallet de exemplo
INSERT INTO pallets (
    id, 
    qr_tag_id, 
    contract_id, 
    origin_location_id, 
    destination_location_id,
    status,
    ai_confidence,
    requires_manual_review,
    created_by
) VALUES (
    'CTX-01012025120000',
    (SELECT id FROM qr_tags WHERE qr_code = 'QR001234567890' LIMIT 1),
    (SELECT id FROM contracts WHERE name = 'Contrato Principal' LIMIT 1),
    (SELECT id FROM locations WHERE name = 'Armazém Central - SP' LIMIT 1),
    (SELECT id FROM locations WHERE name = 'Centro de Distribuição - RJ' LIMIT 1),
    'ativo',
    95.5,
    false,
    'admin'
);

-- Atualizar QR tag para vinculada
UPDATE qr_tags 
SET status = 'vinculado', pallet_id = 'CTX-01012025120000' 
WHERE qr_code = 'QR001234567890';

-- Inserir itens no pallet
INSERT INTO pallet_items (pallet_id, sku_id, quantity_origin, ai_confidence) VALUES
('CTX-01012025120000', (SELECT id FROM skus WHERE code = 'PROD-001' LIMIT 1), 50, 98.2),
('CTX-01012025120000', (SELECT id FROM skus WHERE code = 'PROD-002' LIMIT 1), 30, 92.8),
('CTX-01012025120000', (SELECT id FROM skus WHERE code = 'PROD-003' LIMIT 1), 75, 89.5);

-- Inserir um manifesto de exemplo
INSERT INTO manifests (
    manifest_number,
    contract_id,
    origin_location_id,
    destination_location_id,
    status,
    created_by
) VALUES (
    'MAN-2025-001',
    (SELECT id FROM contracts WHERE name = 'Contrato Principal' LIMIT 1),
    (SELECT id FROM locations WHERE name = 'Armazém Central - SP' LIMIT 1),
    (SELECT id FROM locations WHERE name = 'Centro de Distribuição - RJ' LIMIT 1),
    'rascunho',
    'admin'
);
