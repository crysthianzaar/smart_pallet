-- Migration: Consolidated Pallet System Migration
-- Execute este script no SQL Editor do Supabase
-- Esta migration consolida todas as melhorias necessárias para o sistema completo de pallets

-- =====================================================
-- 1. ADICIONAR CAMPOS FALTANTES NA TABELA PALLETS
-- =====================================================

DO $$ 
BEGIN
    -- Adicionar estimated_item_count se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pallets' AND column_name = 'estimated_item_count') THEN
        ALTER TABLE pallets ADD COLUMN estimated_item_count INTEGER;
        RAISE NOTICE 'Campo estimated_item_count adicionado à tabela pallets';
    END IF;
    
    -- Adicionar vision_confidence se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pallets' AND column_name = 'vision_confidence') THEN
        ALTER TABLE pallets ADD COLUMN vision_confidence DECIMAL(3,2);
        RAISE NOTICE 'Campo vision_confidence adicionado à tabela pallets';
    END IF;
    
    -- Adicionar total_expected_items se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pallets' AND column_name = 'total_expected_items') THEN
        ALTER TABLE pallets ADD COLUMN total_expected_items INTEGER;
        RAISE NOTICE 'Campo total_expected_items adicionado à tabela pallets';
    END IF;
    
    -- Adicionar sealed_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pallets' AND column_name = 'sealed_at') THEN
        ALTER TABLE pallets ADD COLUMN sealed_at TIMESTAMPTZ;
        RAISE NOTICE 'Campo sealed_at adicionado à tabela pallets';
    END IF;
    
    -- Adicionar sealed_by se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pallets' AND column_name = 'sealed_by') THEN
        ALTER TABLE pallets ADD COLUMN sealed_by VARCHAR(255);
        RAISE NOTICE 'Campo sealed_by adicionado à tabela pallets';
    END IF;
END $$;

-- =====================================================
-- 2. CRIAR TABELA VISION_ANALYSES
-- =====================================================

CREATE TABLE IF NOT EXISTS vision_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pallet_id VARCHAR(50) NOT NULL REFERENCES pallets(id) ON DELETE CASCADE,
    item_count INTEGER NOT NULL DEFAULT 0,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    item_count_by_layer JSONB, -- Array de objetos com layer_index, rows, columns, count
    rationale TEXT,
    suggestions TEXT[], -- Array de sugestões
    debug JSONB, -- Informações de debug da análise
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. CRIAR TABELA SELECTED_SKUS
-- =====================================================

CREATE TABLE IF NOT EXISTS selected_skus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pallet_id VARCHAR(50) NOT NULL REFERENCES pallets(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES skus(id),
    expected_quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. ADICIONAR CAMPOS FALTANTES NA TABELA PALLET_ITEMS
-- =====================================================

DO $$ 
BEGIN
    -- Adicionar ai_detected_quantity se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pallet_items' AND column_name = 'ai_detected_quantity') THEN
        ALTER TABLE pallet_items ADD COLUMN ai_detected_quantity INTEGER DEFAULT 0;
        RAISE NOTICE 'Campo ai_detected_quantity adicionado à tabela pallet_items';
    END IF;
    
    -- Adicionar detection_method se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pallet_items' AND column_name = 'detection_method') THEN
        ALTER TABLE pallet_items ADD COLUMN detection_method VARCHAR(50);
        RAISE NOTICE 'Campo detection_method adicionado à tabela pallet_items';
    END IF;
    
    -- Adicionar bounding_box se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pallet_items' AND column_name = 'bounding_box') THEN
        ALTER TABLE pallet_items ADD COLUMN bounding_box JSONB;
        RAISE NOTICE 'Campo bounding_box adicionado à tabela pallet_items';
    END IF;
    
    -- Adicionar notes se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pallet_items' AND column_name = 'notes') THEN
        ALTER TABLE pallet_items ADD COLUMN notes TEXT;
        RAISE NOTICE 'Campo notes adicionado à tabela pallet_items';
    END IF;
END $$;

-- =====================================================
-- 5. ADICIONAR CAMPOS DE METADATA NA TABELA PALLET_PHOTOS
-- =====================================================

DO $$ 
BEGIN
    -- Adicionar file_size se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pallet_photos' AND column_name = 'file_size') THEN
        ALTER TABLE pallet_photos ADD COLUMN file_size INTEGER;
        RAISE NOTICE 'Campo file_size adicionado à tabela pallet_photos';
    END IF;
    
    -- Adicionar mime_type se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pallet_photos' AND column_name = 'mime_type') THEN
        ALTER TABLE pallet_photos ADD COLUMN mime_type VARCHAR(100);
        RAISE NOTICE 'Campo mime_type adicionado à tabela pallet_photos';
    END IF;
    
    -- Adicionar width se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pallet_photos' AND column_name = 'width') THEN
        ALTER TABLE pallet_photos ADD COLUMN width INTEGER;
        RAISE NOTICE 'Campo width adicionado à tabela pallet_photos';
    END IF;
    
    -- Adicionar height se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pallet_photos' AND column_name = 'height') THEN
        ALTER TABLE pallet_photos ADD COLUMN height INTEGER;
        RAISE NOTICE 'Campo height adicionado à tabela pallet_photos';
    END IF;
    
    -- Adicionar created_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pallet_photos' AND column_name = 'created_at') THEN
        ALTER TABLE pallet_photos ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Campo created_at adicionado à tabela pallet_photos';
    END IF;
END $$;

-- =====================================================
-- 6. CRIAR TODOS OS ÍNDICES NECESSÁRIOS
-- =====================================================

DO $$
BEGIN
    -- Índices para vision_analyses
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vision_analyses_pallet_id') THEN
        CREATE INDEX idx_vision_analyses_pallet_id ON vision_analyses(pallet_id);
        RAISE NOTICE 'Índice idx_vision_analyses_pallet_id criado';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vision_analyses_created_at') THEN
        CREATE INDEX idx_vision_analyses_created_at ON vision_analyses(created_at);
        RAISE NOTICE 'Índice idx_vision_analyses_created_at criado';
    END IF;
    
    -- Índices para selected_skus
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_selected_skus_pallet_id') THEN
        CREATE INDEX idx_selected_skus_pallet_id ON selected_skus(pallet_id);
        RAISE NOTICE 'Índice idx_selected_skus_pallet_id criado';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_selected_skus_sku_id') THEN
        CREATE INDEX idx_selected_skus_sku_id ON selected_skus(sku_id);
        RAISE NOTICE 'Índice idx_selected_skus_sku_id criado';
    END IF;
    
    -- Constraint único para selected_skus
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_selected_skus_unique') THEN
        CREATE UNIQUE INDEX idx_selected_skus_unique ON selected_skus(pallet_id, sku_id);
        RAISE NOTICE 'Índice único idx_selected_skus_unique criado';
    END IF;
    
    -- Índices para pallet_items
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pallet_items_ai_confidence') THEN
        CREATE INDEX idx_pallet_items_ai_confidence ON pallet_items(ai_confidence);
        RAISE NOTICE 'Índice idx_pallet_items_ai_confidence criado';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pallet_items_detection_method') THEN
        CREATE INDEX idx_pallet_items_detection_method ON pallet_items(detection_method);
        RAISE NOTICE 'Índice idx_pallet_items_detection_method criado';
    END IF;
    
    -- Índices para pallet_photos
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pallet_photos_pallet_id') THEN
        CREATE INDEX idx_pallet_photos_pallet_id ON pallet_photos(pallet_id);
        RAISE NOTICE 'Índice idx_pallet_photos_pallet_id criado';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pallet_photos_type_stage') THEN
        CREATE INDEX idx_pallet_photos_type_stage ON pallet_photos(photo_type, stage);
        RAISE NOTICE 'Índice idx_pallet_photos_type_stage criado';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pallet_photos_created_at') THEN
        CREATE INDEX idx_pallet_photos_created_at ON pallet_photos(created_at);
        RAISE NOTICE 'Índice idx_pallet_photos_created_at criado';
    END IF;
END $$;

-- =====================================================
-- 7. ADICIONAR COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

-- Comentários para pallets
COMMENT ON COLUMN pallets.estimated_item_count IS 'Contagem estimada de itens pela IA';
COMMENT ON COLUMN pallets.vision_confidence IS 'Confiança da análise de visão (0.0 a 1.0)';
COMMENT ON COLUMN pallets.total_expected_items IS 'Total de itens esperados baseado nos SKUs selecionados';
COMMENT ON COLUMN pallets.sealed_at IS 'Data/hora quando o pallet foi selado';
COMMENT ON COLUMN pallets.sealed_by IS 'Usuário que selou o pallet';

-- Comentários para vision_analyses
COMMENT ON TABLE vision_analyses IS 'Resultados das análises de visão computacional dos pallets';
COMMENT ON COLUMN vision_analyses.item_count IS 'Número total de itens detectados pela IA';
COMMENT ON COLUMN vision_analyses.confidence IS 'Confiança da análise (0.00 a 1.00)';
COMMENT ON COLUMN vision_analyses.item_count_by_layer IS 'Contagem detalhada por camada em formato JSON';
COMMENT ON COLUMN vision_analyses.rationale IS 'Explicação da IA sobre como chegou ao resultado';
COMMENT ON COLUMN vision_analyses.suggestions IS 'Sugestões da IA para melhorar a análise';
COMMENT ON COLUMN vision_analyses.debug IS 'Informações técnicas de debug da análise';

-- Comentários para selected_skus
COMMENT ON TABLE selected_skus IS 'SKUs selecionados para cada pallet com quantidades esperadas';
COMMENT ON COLUMN selected_skus.pallet_id IS 'ID do pallet';
COMMENT ON COLUMN selected_skus.sku_id IS 'ID do SKU selecionado';
COMMENT ON COLUMN selected_skus.expected_quantity IS 'Quantidade esperada deste SKU no pallet';

-- Comentários para pallet_items
COMMENT ON COLUMN pallet_items.ai_detected_quantity IS 'Quantidade detectada pela IA';
COMMENT ON COLUMN pallet_items.ai_confidence IS 'Confiança da detecção da IA (0.00 a 100.00)';
COMMENT ON COLUMN pallet_items.detection_method IS 'Método usado para detecção (vision, manual, etc.)';
COMMENT ON COLUMN pallet_items.bounding_box IS 'Coordenadas do bounding box da detecção';
COMMENT ON COLUMN pallet_items.notes IS 'Observações sobre a detecção';

-- Comentários para pallet_photos
COMMENT ON COLUMN pallet_photos.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN pallet_photos.mime_type IS 'Tipo MIME do arquivo';
COMMENT ON COLUMN pallet_photos.width IS 'Largura da imagem em pixels';
COMMENT ON COLUMN pallet_photos.height IS 'Altura da imagem em pixels';
COMMENT ON COLUMN pallet_photos.created_at IS 'Data de criação do registro';

-- =====================================================
-- 8. CRIAR VIEW PARA ANÁLISE DE DADOS CONSOLIDADA
-- =====================================================

CREATE OR REPLACE VIEW pallet_analysis_summary AS
SELECT 
    p.id as pallet_id,
    p.created_at as pallet_created_at,
    p.status as pallet_status,
    p.estimated_item_count,
    p.vision_confidence,
    p.total_expected_items,
    
    -- Informações do contrato
    c.name as contract_name,
    c.company as contract_company,
    
    -- Localizações
    ol.name as origin_location,
    dl.name as destination_location,
    
    -- QR Tag
    qt.qr_code,
    
    -- Análise de visão
    va.item_count as vision_item_count,
    va.confidence as vision_detailed_confidence,
    va.rationale as vision_rationale,
    
    -- Estatísticas de SKUs
    (SELECT COUNT(*) FROM selected_skus ss WHERE ss.pallet_id = p.id) as selected_skus_count,
    (SELECT COALESCE(SUM(ss.expected_quantity), 0) FROM selected_skus ss WHERE ss.pallet_id = p.id) as total_expected_from_skus,
    
    -- Estatísticas de fotos
    (SELECT COUNT(*) FROM pallet_photos pp WHERE pp.pallet_id = p.id) as photos_count,
    (SELECT COUNT(*) FROM pallet_photos pp WHERE pp.pallet_id = p.id AND pp.photo_type = 'frontal') as frontal_photos,
    (SELECT COUNT(*) FROM pallet_photos pp WHERE pp.pallet_id = p.id AND pp.photo_type = 'lateral') as lateral_photos,
    (SELECT COUNT(*) FROM pallet_photos pp WHERE pp.pallet_id = p.id AND pp.photo_type = 'superior') as superior_photos,
    
    -- Estatísticas de itens detectados
    (SELECT COUNT(*) FROM pallet_items pi WHERE pi.pallet_id = p.id) as detected_items_count,
    (SELECT COALESCE(AVG(pi.ai_confidence), 0) FROM pallet_items pi WHERE pi.pallet_id = p.id) as avg_item_confidence,
    (SELECT COALESCE(SUM(COALESCE(pi.ai_detected_quantity, pi.quantity_origin)), 0) FROM pallet_items pi WHERE pi.pallet_id = p.id) as total_detected_quantity

FROM pallets p
LEFT JOIN contracts c ON p.contract_id = c.id
LEFT JOIN locations ol ON p.origin_location_id = ol.id
LEFT JOIN locations dl ON p.destination_location_id = dl.id
LEFT JOIN qr_tags qt ON p.qr_tag_id = qt.id
LEFT JOIN vision_analyses va ON va.pallet_id = p.id;

-- Comentário da view
COMMENT ON VIEW pallet_analysis_summary IS 'View consolidada para análise de dados dos pallets com todas as informações relacionadas';

-- =====================================================
-- 9. MENSAGEM DE CONCLUSÃO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'MIGRATION CONSOLIDADA EXECUTADA COM SUCESSO!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Funcionalidades implementadas:';
    RAISE NOTICE '✓ Campos de análise de visão nos pallets';
    RAISE NOTICE '✓ Tabela vision_analyses para resultados da IA';
    RAISE NOTICE '✓ Tabela selected_skus para SKUs planejados';
    RAISE NOTICE '✓ Campos de detecção IA nos pallet_items';
    RAISE NOTICE '✓ Metadata completa nas pallet_photos';
    RAISE NOTICE '✓ Índices otimizados para performance';
    RAISE NOTICE '✓ View pallet_analysis_summary para relatórios';
    RAISE NOTICE '✓ Documentação completa com comentários';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'O sistema está pronto para:';
    RAISE NOTICE '• Criação de pallets com SKUs selecionados';
    RAISE NOTICE '• Análise de visão computacional completa';
    RAISE NOTICE '• Armazenamento de fotos com metadata';
    RAISE NOTICE '• Comparação entre esperado vs detectado';
    RAISE NOTICE '• Análise de dados e relatórios avançados';
    RAISE NOTICE '==============================================';
END $$;
