import { BaseRepository } from './base-repository';
import { Receipt, ReceiptCreate, ReceiptUpdate } from '../models';
import { db } from '../database';

export class ReceiptRepository extends BaseRepository<Receipt, ReceiptCreate, ReceiptUpdate> {
  constructor() {
    super('receipts');
  }

  async findByPallet(palletId: string): Promise<Receipt | null> {
    return this.findOneBy('pallet_id', palletId);
  }

  async findByManifest(manifestId: string): Promise<Receipt[]> {
    return this.findBy('manifest_id', manifestId);
  }

  async findByLocation(locationId: string): Promise<Receipt[]> {
    return this.findBy('location_id', locationId);
  }

  async findByStatus(status: string): Promise<Receipt[]> {
    return this.findBy('status', status);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Receipt[]> {
    const stmt = db.prepare(`
      SELECT * FROM ${this.tableName} 
      WHERE received_at BETWEEN ? AND ?
      ORDER BY received_at DESC
    `);
    
    return stmt.all(startDate.toISOString(), endDate.toISOString()) as Receipt[];
  }

  async getWithDetails(receiptId: string): Promise<{
    receipt: Receipt;
    pallet?: any;
    manifest?: any;
    location?: any;
    comparisons?: any[];
  } | null> {
    const receipt = await this.findById(receiptId);
    if (!receipt) return null;

    // Get pallet details
    const palletStmt = db.prepare(`
      SELECT p.*, qt.qr_code, c.name as contract_name, c.company as contract_company
      FROM pallets p
      JOIN qr_tags qt ON p.qr_tag_id = qt.id
      JOIN contracts c ON p.contract_id = c.id
      WHERE p.id = ?
    `);
    const pallet = palletStmt.get(receipt.pallet_id);

    // Get manifest details if exists
    let manifest = null;
    if (receipt.manifest_id) {
      const manifestStmt = db.prepare('SELECT * FROM manifests WHERE id = ?');
      manifest = manifestStmt.get(receipt.manifest_id);
    }

    // Get location details
    const locationStmt = db.prepare('SELECT * FROM locations WHERE id = ?');
    const location = locationStmt.get(receipt.location_id);

    // Get comparisons
    const comparisonsStmt = db.prepare(`
      SELECT c.*, s.name as sku_name, s.code as sku_code
      FROM comparisons c
      JOIN skus s ON c.sku_id = s.id
      WHERE c.receipt_id = ?
      ORDER BY c.created_at
    `);
    const comparisons = comparisonsStmt.all(receiptId);

    return {
      receipt,
      pallet,
      manifest,
      location,
      comparisons,
    };
  }

  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    todayCount: number;
    avgConfidence: number;
    criticalCount: number;
  }> {
    const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`);
    const total = (totalStmt.get() as { count: number }).count;

    const statusStmt = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM ${this.tableName} 
      GROUP BY status
    `);
    const statusResults = statusStmt.all() as { status: string; count: number }[];
    const byStatus = statusResults.reduce((acc, { status, count }) => {
      acc[status] = count;
      return acc;
    }, {} as Record<string, number>);

    // Today's receipts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM ${this.tableName} 
      WHERE received_at >= ?
    `);
    const todayCount = (todayStmt.get(today.toISOString()) as { count: number }).count;

    // Average confidence
    const avgConfidenceStmt = db.prepare(`
      SELECT AVG(ai_confidence) as avg 
      FROM ${this.tableName} 
      WHERE ai_confidence IS NOT NULL
    `);
    const avgResult = avgConfidenceStmt.get() as { avg: number | null };
    const avgConfidence = avgResult.avg ? Math.round(avgResult.avg * 100) / 100 : 0;

    // Critical receipts
    const criticalCount = byStatus['critico'] || 0;

    return {
      total,
      byStatus,
      todayCount,
      avgConfidence,
      criticalCount,
    };
  }
}
