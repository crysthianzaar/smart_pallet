import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';
import { db } from '../../../../lib/database';

export async function POST(request: NextRequest) {
  try {
    const comparisonRepository = RepositoryFactory.getComparisonRepository();
    const receiptRepository = RepositoryFactory.getReceiptRepository();
    
    // Buscar recebimentos existentes
    const receipts = await receiptRepository.findAll(10);
    
    if (receipts.length === 0) {
      return createErrorResponse('No receipts found to generate comparisons', 400);
    }
    
    let createdComparisons = 0;
    
    for (const receipt of receipts) {
      // Verificar se já existem comparações para este recebimento
      const existingComparisons = await comparisonRepository.findByReceipt(receipt.id);
      if (existingComparisons.length > 0) {
        continue; // Pular se já tem comparações
      }
      
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
      
      // Para cada pallet, buscar itens e criar comparações
      for (const palletId of palletIds) {
        const palletItemsStmt = db.prepare(`
          SELECT 
            pi.*,
            s.id as sku_id,
            s.name as sku_name,
            s.code as sku_code
          FROM pallet_items pi
          JOIN skus s ON pi.sku_id = s.id
          WHERE pi.pallet_id = ?
        `);
        
        const palletItems = palletItemsStmt.all(palletId) as any[];
        
        for (const item of palletItems) {
          // Simular diferenças (em um sistema real, isso viria da contagem real)
          const quantityOrigin = item.quantity_origin || item.manual_count_origin || 0;
          let quantityDestination = quantityOrigin;
          
          // Simular algumas diferenças aleatórias
          const random = Math.random();
          if (random < 0.3) { // 30% chance de diferença
            if (random < 0.15) {
              // Falta (diferença negativa)
              quantityDestination = Math.max(0, quantityOrigin - Math.floor(Math.random() * 3 + 1));
            } else {
              // Sobra (diferença positiva)
              quantityDestination = quantityOrigin + Math.floor(Math.random() * 2 + 1);
            }
          }
          
          const difference = quantityDestination - quantityOrigin;
          let differenceType: string | undefined;
          
          if (difference < 0) {
            differenceType = 'falta';
          } else if (difference > 0) {
            differenceType = 'sobra';
          }
          
          // Criar comparação
          await comparisonRepository.createComparison(
            receipt.id,
            palletId,
            item.sku_id,
            quantityOrigin,
            quantityDestination,
            differenceType,
            difference !== 0 ? 'Diferença identificada durante conferência' : undefined
          );
          
          createdComparisons++;
        }
      }
    }
    
    return createApiResponse({ 
      message: `${createdComparisons} comparisons generated successfully`,
      count: createdComparisons 
    });
  } catch (error) {
    console.error('Error generating sample comparisons:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate sample comparisons';
    return createErrorResponse(message, 500);
  }
}
