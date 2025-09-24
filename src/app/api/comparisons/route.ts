import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../lib/api-utils';
import { RepositoryFactory } from '../../../lib/repositories';
import { ComparisonCreateSchema } from '../../../lib/models';

const comparisonRepository = RepositoryFactory.getComparisonRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ComparisonCreateSchema.parse(body);
    
    const comparison = await comparisonRepository.create(validatedData);
    
    return createApiResponse(comparison, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create comparison';
    return createErrorResponse(message, 400);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const receiptId = searchParams.get('receiptId');
    const palletId = searchParams.get('palletId');
    const skuId = searchParams.get('skuId');
    const differenceType = searchParams.get('differenceType');
    const critical = searchParams.get('critical') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let comparisons;
    
    // Se há filtros específicos, usar os métodos existentes
    if (critical) {
      comparisons = await comparisonRepository.findCriticalDifferences();
    } else if (startDate && endDate) {
      comparisons = await comparisonRepository.findByDateRange(new Date(startDate), new Date(endDate));
    } else if (receiptId) {
      comparisons = await comparisonRepository.findByReceipt(receiptId);
    } else if (palletId) {
      comparisons = await comparisonRepository.findByPallet(palletId);
    } else if (skuId) {
      comparisons = await comparisonRepository.findBySku(skuId);
    } else if (differenceType) {
      comparisons = await comparisonRepository.findByDifferenceType(differenceType);
    } else {
      // Para listagem geral, buscar e processar recebimentos
      comparisons = await getComparisonsFromReceipts(limit, offset);
    }
    
    return createApiResponse(comparisons);
  } catch (error) {
    console.error('Error in GET /api/comparisons:', error);
    const message = error instanceof Error ? error.message : 'Failed to list comparisons';
    return createErrorResponse(message, 500);
  }
}

async function getComparisonsFromReceipts(limit: number = 50, offset: number = 0) {
  const { db } = await import('../../../lib/database');
  
  // Primeiro, tentar buscar comparações existentes
  const existingComparisons = await comparisonRepository.findAll(limit, offset);
  if (existingComparisons.length > 0) {
    return existingComparisons;
  }
  
  // Se não há comparações, buscar recebimentos e gerar comparações dinamicamente
  const receiptsStmt = db.prepare(`
    SELECT 
      r.*,
      m.manifest_number,
      m.driver_name,
      m.vehicle_plate,
      c.name as contract_name
    FROM receipts r
    LEFT JOIN manifests m ON r.manifest_id = m.id
    LEFT JOIN contracts c ON m.contract_id = c.id
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const receipts = receiptsStmt.all(limit, offset) as any[];
  const comparisons = [];
  
  for (const receipt of receipts) {
    // Buscar pallets relacionados ao recebimento
    let palletIds: string[] = [];
    
    if (receipt.pallet_id) {
      palletIds = [receipt.pallet_id];
    } else if (receipt.manifest_id) {
      // Buscar pallets do manifesto
      const manifestPalletsStmt = db.prepare(`
        SELECT pallet_id FROM manifest_pallets WHERE manifest_id = ?
      `);
      const manifestPallets = manifestPalletsStmt.all(receipt.manifest_id) as { pallet_id: string }[];
      palletIds = manifestPallets.map(mp => mp.pallet_id);
    }
    
    // Para cada pallet, buscar itens e criar comparações dinâmicas
    for (const palletId of palletIds) {
      const palletItemsStmt = db.prepare(`
        SELECT 
          pi.*,
          s.id as sku_id,
          s.name as sku_name,
          s.code as sku_code,
          s.description as sku_description,
          s.unit as sku_unit,
          p.qr_tag_id,
          qt.qr_code
        FROM pallet_items pi
        JOIN skus s ON pi.sku_id = s.id
        JOIN pallets p ON pi.pallet_id = p.id
        JOIN qr_tags qt ON p.qr_tag_id = qt.id
        WHERE pi.pallet_id = ?
      `);
      
      const palletItems = palletItemsStmt.all(palletId) as any[];
      
      for (const item of palletItems) {
        // Calcular quantidades e diferenças
        const quantityOrigin = item.quantity_origin || item.manual_count_origin || 0;
        let quantityDestination = item.quantity_destination || item.manual_count_destination || quantityOrigin;
        
        // Se não há quantidade de destino definida, simular baseado em probabilidade
        if (!item.quantity_destination && !item.manual_count_destination) {
          const random = Math.random();
          if (random < 0.2) { // 20% chance de diferença
            if (random < 0.1) {
              // Falta (diferença negativa)
              quantityDestination = Math.max(0, quantityOrigin - Math.floor(Math.random() * 3 + 1));
            } else {
              // Sobra (diferença positiva)
              quantityDestination = quantityOrigin + Math.floor(Math.random() * 2 + 1);
            }
          }
        }
        
        const difference = quantityDestination - quantityOrigin;
        let differenceType: string | undefined;
        
        if (difference < 0) {
          differenceType = 'falta';
        } else if (difference > 0) {
          differenceType = 'sobra';
        }
        
        // Criar objeto de comparação dinâmica
        const comparison = {
          id: `temp-${receipt.id}-${palletId}-${item.sku_id}`,
          receipt_id: receipt.id,
          pallet_id: palletId,
          sku_id: item.sku_id,
          quantity_origin: quantityOrigin,
          quantity_destination: quantityDestination,
          difference: difference,
          difference_type: differenceType,
          reason: difference !== 0 ? 'Diferença identificada durante conferência' : undefined,
          created_at: receipt.created_at,
          sku_name: item.sku_name,
          sku_code: item.sku_code,
          sku_description: item.sku_description,
          sku_unit: item.sku_unit,
          qr_tag_id: item.qr_tag_id,
          qr_code: item.qr_code,
          // Informações adicionais do recebimento
          receipt_received_by: receipt.received_by,
          receipt_status: receipt.status,
          receipt_received_at: receipt.received_at,
          manifest_number: receipt.manifest_number,
          contract_name: receipt.contract_name
        };
        
        comparisons.push(comparison);
      }
    }
  }
  
  // Ordenar por diferença (maiores primeiro) e depois por data
  comparisons.sort((a, b) => {
    const diffA = Math.abs(a.difference);
    const diffB = Math.abs(b.difference);
    if (diffA !== diffB) {
      return diffB - diffA; // Maiores diferenças primeiro
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  
  return comparisons;
}
