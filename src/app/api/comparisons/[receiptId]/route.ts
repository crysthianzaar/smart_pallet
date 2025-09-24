import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { db } from '../../../../lib/database';

export async function GET(request: NextRequest, { params }: { params: { receiptId: string } }) {
  try {
    const receiptId = params.receiptId;
    
    // Buscar informações completas do recebimento, manifesto e comparações
    const receiptInfoStmt = db.prepare(`
      SELECT 
        r.*,
        m.manifest_number,
        m.driver_name,
        m.vehicle_plate,
        m.status as manifest_status,
        c.name as contract_name,
        c.company as contract_company,
        ol.name as origin_location_name,
        ol.city as origin_city,
        ol.state as origin_state,
        dl.name as destination_location_name,
        dl.city as destination_city,
        dl.state as destination_state
      FROM receipts r
      LEFT JOIN manifests m ON r.manifest_id = m.id
      LEFT JOIN contracts c ON m.contract_id = c.id
      LEFT JOIN locations ol ON m.origin_location_id = ol.id
      LEFT JOIN locations dl ON m.destination_location_id = dl.id
      WHERE r.id = ?
    `);
    
    const receiptInfo = receiptInfoStmt.get(receiptId);
    
    if (!receiptInfo) {
      return createErrorResponse('Receipt not found', 404);
    }
    
    // Buscar todas as comparações para este recebimento
    const comparisonsStmt = db.prepare(`
      SELECT 
        comp.*,
        s.name as sku_name,
        s.code as sku_code,
        s.description as sku_description,
        s.unit as sku_unit,
        p.qr_tag_id,
        qt.qr_code
      FROM comparisons comp
      JOIN skus s ON comp.sku_id = s.id
      JOIN pallets p ON comp.pallet_id = p.id
      JOIN qr_tags qt ON p.qr_tag_id = qt.id
      WHERE comp.receipt_id = ?
      ORDER BY ABS(comp.difference) DESC, comp.created_at DESC
    `);
    
    const comparisons = comparisonsStmt.all(receiptId);
    
    // Calcular estatísticas das comparações
    const stats = {
      total: comparisons.length,
      totalDifferences: comparisons.filter((c: any) => c.difference !== 0).length,
      criticalCount: comparisons.filter((c: any) => Math.abs(c.difference) >= 5).length,
      byDifferenceType: comparisons.reduce((acc: any, comp: any) => {
        if (comp.difference_type) {
          acc[comp.difference_type] = (acc[comp.difference_type] || 0) + 1;
        }
        return acc;
      }, {}),
      totalQuantityOrigin: comparisons.reduce((sum: number, comp: any) => sum + comp.quantity_origin, 0),
      totalQuantityDestination: comparisons.reduce((sum: number, comp: any) => sum + comp.quantity_destination, 0),
      totalDifference: comparisons.reduce((sum: number, comp: any) => sum + Math.abs(comp.difference), 0),
    };
    
    // Buscar informações dos pallets relacionados
    const palletsStmt = db.prepare(`
      SELECT DISTINCT
        p.id,
        p.qr_tag_id,
        p.status as pallet_status,
        qt.qr_code,
        COUNT(comp.id) as comparison_count
      FROM pallets p
      JOIN qr_tags qt ON p.qr_tag_id = qt.id
      LEFT JOIN comparisons comp ON p.id = comp.pallet_id AND comp.receipt_id = ?
      WHERE p.id IN (
        SELECT DISTINCT pallet_id FROM comparisons WHERE receipt_id = ?
      )
      GROUP BY p.id, p.qr_tag_id, p.status, qt.qr_code
    `);
    
    const pallets = palletsStmt.all(receiptId, receiptId);
    
    return createApiResponse({
      receipt: receiptInfo,
      comparisons,
      stats,
      pallets
    });
  } catch (error) {
    console.error('Error fetching comparison details:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch comparison details';
    return createErrorResponse(message, 500);
  }
}
