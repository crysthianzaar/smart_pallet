import { BaseRepository } from './base-repository';
import { Comparison, ComparisonCreate } from '../models';
import { db } from '../database';

export class ComparisonRepository extends BaseRepository<Comparison, ComparisonCreate> {
  constructor() {
    super('comparisons');
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Comparison[]> {
    const stmt = db.prepare(`
      SELECT 
        c.*,
        s.name as sku_name,
        s.code as sku_code,
        s.description as sku_description,
        s.unit as sku_unit,
        p.qr_tag_id,
        qt.qr_code
      FROM ${this.tableName} c
      JOIN skus s ON c.sku_id = s.id
      JOIN pallets p ON c.pallet_id = p.id
      JOIN qr_tags qt ON p.qr_tag_id = qt.id
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `);
    
    return stmt.all(limit, offset) as Comparison[];
  }

  async findByReceipt(receiptId: string): Promise<Comparison[]> {
    return this.findBy('receipt_id', receiptId);
  }

  async findByPallet(palletId: string): Promise<Comparison[]> {
    return this.findBy('pallet_id', palletId);
  }

  async findBySku(skuId: string): Promise<Comparison[]> {
    return this.findBy('sku_id', skuId);
  }

  async findByDifferenceType(differenceType: string): Promise<Comparison[]> {
    return this.findBy('difference_type', differenceType);
  }

  async findCriticalDifferences(threshold: number = 5): Promise<Comparison[]> {
    const stmt = db.prepare(`
      SELECT c.*, s.name as sku_name, s.code as sku_code, p.qr_tag_id
      FROM ${this.tableName} c
      JOIN skus s ON c.sku_id = s.id
      JOIN pallets p ON c.pallet_id = p.id
      WHERE ABS(c.difference) >= ?
      ORDER BY ABS(c.difference) DESC, c.created_at DESC
    `);
    
    return stmt.all(threshold) as Comparison[];
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Comparison[]> {
    const stmt = db.prepare(`
      SELECT c.*, s.name as sku_name, s.code as sku_code, 
             p.qr_tag_id, qt.qr_code, r.received_at
      FROM ${this.tableName} c
      JOIN skus s ON c.sku_id = s.id
      JOIN pallets p ON c.pallet_id = p.id
      JOIN qr_tags qt ON p.qr_tag_id = qt.id
      JOIN receipts r ON c.receipt_id = r.id
      WHERE c.created_at BETWEEN ? AND ?
      ORDER BY c.created_at DESC
    `);
    
    return stmt.all(startDate.toISOString(), endDate.toISOString()) as Comparison[];
  }

  async getStatistics(): Promise<{
    total: number;
    byDifferenceType: Record<string, number>;
    criticalCount: number;
    avgDifference: number;
    topSkusWithDifferences: Array<{
      sku_id: string;
      sku_name: string;
      sku_code: string;
      difference_count: number;
      total_difference: number;
    }>;
  }> {
    const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`);
    const total = (totalStmt.get() as { count: number }).count;

    // By difference type
    const typeStmt = db.prepare(`
      SELECT difference_type, COUNT(*) as count 
      FROM ${this.tableName} 
      WHERE difference_type IS NOT NULL
      GROUP BY difference_type
    `);
    const typeResults = typeStmt.all() as { difference_type: string; count: number }[];
    const byDifferenceType = typeResults.reduce((acc, { difference_type, count }) => {
      acc[difference_type] = count;
      return acc;
    }, {} as Record<string, number>);

    // Critical differences (absolute difference >= 5)
    const criticalStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM ${this.tableName} 
      WHERE ABS(difference) >= 5
    `);
    const criticalCount = (criticalStmt.get() as { count: number }).count;

    // Average difference
    const avgStmt = db.prepare(`
      SELECT AVG(ABS(difference)) as avg 
      FROM ${this.tableName}
    `);
    const avgResult = avgStmt.get() as { avg: number | null };
    const avgDifference = avgResult.avg ? Math.round(avgResult.avg * 100) / 100 : 0;

    // Top SKUs with differences
    const topSkusStmt = db.prepare(`
      SELECT 
        c.sku_id,
        s.name as sku_name,
        s.code as sku_code,
        COUNT(*) as difference_count,
        SUM(ABS(c.difference)) as total_difference
      FROM ${this.tableName} c
      JOIN skus s ON c.sku_id = s.id
      GROUP BY c.sku_id, s.name, s.code
      ORDER BY difference_count DESC, total_difference DESC
      LIMIT 10
    `);
    const topSkusWithDifferences = topSkusStmt.all() as Array<{
      sku_id: string;
      sku_name: string;
      sku_code: string;
      difference_count: number;
      total_difference: number;
    }>;

    return {
      total,
      byDifferenceType,
      criticalCount,
      avgDifference,
      topSkusWithDifferences,
    };
  }

  async createComparison(
    receiptId: string,
    palletId: string,
    skuId: string,
    quantityOrigin: number,
    quantityDestination: number,
    differenceType?: string,
    reason?: string,
    evidencePhotos?: string[]
  ): Promise<Comparison> {
    const difference = quantityDestination - quantityOrigin;
    
    const comparisonData: ComparisonCreate = {
      receipt_id: receiptId,
      pallet_id: palletId,
      sku_id: skuId,
      quantity_origin: quantityOrigin,
      quantity_destination: quantityDestination,
      difference,
      difference_type: differenceType as 'falta' | 'sobra' | 'avaria' | 'troca' | undefined,
      reason,
      evidence_photos: evidencePhotos ? JSON.stringify(evidencePhotos) : undefined,
    };

    return this.create(comparisonData);
  }
}
