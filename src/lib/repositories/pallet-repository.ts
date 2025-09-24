import { BaseRepository } from './base-repository';
import { Pallet, PalletCreate, PalletUpdate, PalletItem, PalletPhoto } from '../models';
import { db } from '../database';

export class PalletRepository extends BaseRepository<Pallet, PalletCreate, PalletUpdate> {
  constructor() {
    super('pallets');
  }

  // Sobrescreve o método generateId para usar o formato CTX-DDMMYYYYHHMMSS
  protected generateId(): string {
    const now = new Date();
    
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    return `CTX-${day}${month}${year}${hours}${minutes}${seconds}`;
  }

  async findByQrTag(qrTagId: string): Promise<Pallet | null> {
    return this.findOneBy('qr_tag_id', qrTagId);
  }

  async findByStatus(status: string): Promise<Pallet[]> {
    const stmt = db.prepare(`
      SELECT 
        p.*,
        c.name as contract_name,
        c.company as contract_company,
        ol.name as origin_name,
        dl.name as destination_name,
        qt.qr_code
      FROM ${this.tableName} p
      LEFT JOIN contracts c ON p.contract_id = c.id
      LEFT JOIN locations ol ON p.origin_location_id = ol.id
      LEFT JOIN locations dl ON p.destination_location_id = dl.id
      LEFT JOIN qr_tags qt ON p.qr_tag_id = qt.id
      WHERE p.status = ?
      ORDER BY p.created_at DESC
    `);
    return stmt.all(status) as Pallet[];
  }

  async findByContract(contractId: string): Promise<Pallet[]> {
    return this.findBy('contract_id', contractId);
  }

  async findSealed(): Promise<Pallet[]> {
    return this.findByStatus('selado');
  }

  async findInTransport(): Promise<Pallet[]> {
    return this.findByStatus('em_transporte');
  }

  async findRequiringManualReview(): Promise<Pallet[]> {
    const stmt = db.prepare(`
      SELECT 
        p.*,
        c.name as contract_name,
        c.company as contract_company,
        ol.name as origin_name,
        dl.name as destination_name,
        qt.qr_code
      FROM ${this.tableName} p
      LEFT JOIN contracts c ON p.contract_id = c.id
      LEFT JOIN locations ol ON p.origin_location_id = ol.id
      LEFT JOIN locations dl ON p.destination_location_id = dl.id
      LEFT JOIN qr_tags qt ON p.qr_tag_id = qt.id
      WHERE p.requires_manual_review = 1 
      ORDER BY p.created_at DESC
    `);
    return stmt.all() as Pallet[];
  }

  async seal(palletId: string, sealedBy: string): Promise<boolean> {
    const stmt = db.prepare(`
      UPDATE ${this.tableName} 
      SET status = 'selado', sealed_at = ?, sealed_by = ?, updated_at = ?
      WHERE id = ? AND status = 'rascunho'
    `);
    const now = this.getCurrentTimestamp();
    const result = stmt.run(now, sealedBy, now, palletId);
    return result.changes > 0;
  }

  async setInTransport(palletId: string): Promise<boolean> {
    const stmt = db.prepare(`
      UPDATE ${this.tableName} 
      SET status = 'em_transporte', updated_at = ?
      WHERE id = ? AND status = 'selado'
    `);
    const result = stmt.run(this.getCurrentTimestamp(), palletId);
    return result.changes > 0;
  }

  async receive(palletId: string): Promise<boolean> {
    const stmt = db.prepare(`
      UPDATE ${this.tableName} 
      SET status = 'recebido', updated_at = ?
      WHERE id = ? AND status = 'em_transporte'
    `);
    const result = stmt.run(this.getCurrentTimestamp(), palletId);
    return result.changes > 0;
  }

  async findAllWithDetails(limit: number = 50, offset: number = 0): Promise<Pallet[]> {
    const stmt = db.prepare(`
      SELECT 
        p.*,
        c.name as contract_name,
        c.company as contract_company,
        ol.name as origin_name,
        dl.name as destination_name,
        qt.qr_code
      FROM ${this.tableName} p
      LEFT JOIN contracts c ON p.contract_id = c.id
      LEFT JOIN locations ol ON p.origin_location_id = ol.id
      LEFT JOIN locations dl ON p.destination_location_id = dl.id
      LEFT JOIN qr_tags qt ON p.qr_tag_id = qt.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as Pallet[];
  }

  async getWithDetails(palletId: string): Promise<{
    pallet: Pallet;
    items: PalletItem[];
    photos: PalletPhoto[];
  } | null> {
    const stmt = db.prepare(`
      SELECT 
        p.*,
        c.name as contract_name,
        c.company as contract_company,
        ol.name as origin_name,
        dl.name as destination_name,
        qt.qr_code
      FROM ${this.tableName} p
      LEFT JOIN contracts c ON p.contract_id = c.id
      LEFT JOIN locations ol ON p.origin_location_id = ol.id
      LEFT JOIN locations dl ON p.destination_location_id = dl.id
      LEFT JOIN qr_tags qt ON p.qr_tag_id = qt.id
      WHERE p.id = ?
    `);
    
    const pallet = stmt.get(palletId) as Pallet | undefined;
    if (!pallet) return null;

    const itemsStmt = db.prepare(`
      SELECT pi.*, s.name as sku_name, s.code as sku_code
      FROM pallet_items pi
      JOIN skus s ON pi.sku_id = s.id
      WHERE pi.pallet_id = ?
    `);
    const items = itemsStmt.all(palletId) as PalletItem[];

    const photosStmt = db.prepare(`
      SELECT * FROM pallet_photos 
      WHERE pallet_id = ? 
      ORDER BY photo_type, stage
    `);
    const photos = photosStmt.all(palletId) as PalletPhoto[];

    return { pallet, items, photos };
  }

  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    requiresManualReview: number;
    avgConfidence: number;
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

    const manualReviewStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM ${this.tableName} 
      WHERE requires_manual_review = 1
    `);
    const requiresManualReview = (manualReviewStmt.get() as { count: number }).count;

    const avgConfidenceStmt = db.prepare(`
      SELECT AVG(ai_confidence) as avg 
      FROM ${this.tableName} 
      WHERE ai_confidence IS NOT NULL
    `);
    const avgResult = avgConfidenceStmt.get() as { avg: number | null };
    const avgConfidence = avgResult.avg || 0;

    return {
      total,
      byStatus,
      requiresManualReview,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
    };
  }
}
