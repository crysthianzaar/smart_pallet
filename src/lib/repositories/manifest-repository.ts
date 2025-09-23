import { BaseRepository } from './base-repository';
import { Manifest, ManifestCreate, ManifestUpdate, ManifestPallet } from '../models';
import { db } from '../database';

export class ManifestRepository extends BaseRepository<Manifest, ManifestCreate, ManifestUpdate> {
  constructor() {
    super('manifests');
  }

  async findByStatus(status: string): Promise<Manifest[]> {
    return this.findBy('status', status);
  }

  async findByContract(contractId: string): Promise<Manifest[]> {
    return this.findBy('contract_id', contractId);
  }

  async generateManifestNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const stmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM ${this.tableName} 
      WHERE manifest_number LIKE ?
    `);
    const count = (stmt.get(`MAN-${year}${month}-%`) as { count: number }).count;
    
    return `MAN-${year}${month}-${String(count + 1).padStart(3, '0')}`;
  }

  async create(data: ManifestCreate): Promise<Manifest> {
    const manifestNumber = await this.generateManifestNumber();
    const manifestData = {
      ...data,
      manifest_number: manifestNumber,
    };
    
    return super.create(manifestData);
  }

  async addPallet(manifestId: string, palletId: string): Promise<boolean> {
    const stmt = db.prepare(`
      INSERT INTO manifest_pallets (id, manifest_id, pallet_id, created_at)
      VALUES (?, ?, ?, ?)
    `);
    
    try {
      stmt.run(this.generateId(), manifestId, palletId, this.getCurrentTimestamp());
      return true;
    } catch (error) {
      return false;
    }
  }

  async removePallet(manifestId: string, palletId: string): Promise<boolean> {
    const stmt = db.prepare(`
      DELETE FROM manifest_pallets 
      WHERE manifest_id = ? AND pallet_id = ?
    `);
    
    const result = stmt.run(manifestId, palletId);
    return result.changes > 0;
  }

  async getPallets(manifestId: string): Promise<any[]> {
    const stmt = db.prepare(`
      SELECT 
        mp.*,
        p.id as pallet_id,
        p.qr_tag_id,
        p.status as pallet_status,
        p.ai_confidence,
        p.requires_manual_review,
        qt.qr_code
      FROM manifest_pallets mp
      JOIN pallets p ON mp.pallet_id = p.id
      JOIN qr_tags qt ON p.qr_tag_id = qt.id
      WHERE mp.manifest_id = ?
      ORDER BY mp.created_at
    `);
    
    return stmt.all(manifestId) as any[];
  }

  async markAsLoaded(manifestId: string): Promise<boolean> {
    const stmt = db.prepare(`
      UPDATE ${this.tableName} 
      SET status = 'carregado', loaded_at = ?, updated_at = ?
      WHERE id = ? AND status = 'rascunho'
    `);
    
    const now = this.getCurrentTimestamp();
    const result = stmt.run(now, now, manifestId);
    
    if (result.changes > 0) {
      // Atualizar status dos pallets para em_transporte
      const updatePalletsStmt = db.prepare(`
        UPDATE pallets 
        SET status = 'em_transporte', updated_at = ?
        WHERE id IN (
          SELECT pallet_id FROM manifest_pallets WHERE manifest_id = ?
        )
      `);
      updatePalletsStmt.run(now, manifestId);
    }
    
    return result.changes > 0;
  }

  async markAsInTransit(manifestId: string): Promise<boolean> {
    const stmt = db.prepare(`
      UPDATE ${this.tableName} 
      SET status = 'em_transito', updated_at = ?
      WHERE id = ? AND status = 'carregado'
    `);
    
    const result = stmt.run(this.getCurrentTimestamp(), manifestId);
    return result.changes > 0;
  }

  async markAsDelivered(manifestId: string): Promise<boolean> {
    const stmt = db.prepare(`
      UPDATE ${this.tableName} 
      SET status = 'entregue', updated_at = ?
      WHERE id = ? AND status = 'em_transito'
    `);
    
    const result = stmt.run(this.getCurrentTimestamp(), manifestId);
    return result.changes > 0;
  }

  async getWithDetails(manifestId: string): Promise<{
    manifest: Manifest;
    pallets: any[];
    contract?: any;
    originLocation?: any;
    destinationLocation?: any;
  } | null> {
    const manifest = await this.findById(manifestId);
    if (!manifest) return null;

    const pallets = await this.getPallets(manifestId);

    // Get related data
    const contractStmt = db.prepare('SELECT * FROM contracts WHERE id = ?');
    const contract = contractStmt.get(manifest.contract_id);

    const originStmt = db.prepare('SELECT * FROM locations WHERE id = ?');
    const originLocation = originStmt.get(manifest.origin_location_id);

    const destinationStmt = db.prepare('SELECT * FROM locations WHERE id = ?');
    const destinationLocation = destinationStmt.get(manifest.destination_location_id);

    return {
      manifest,
      pallets,
      contract,
      originLocation,
      destinationLocation,
    };
  }

  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    totalPallets: number;
    avgPalletsPerManifest: number;
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

    const palletsStmt = db.prepare(`SELECT COUNT(*) as count FROM manifest_pallets`);
    const totalPallets = (palletsStmt.get() as { count: number }).count;

    const avgPalletsPerManifest = total > 0 ? Math.round((totalPallets / total) * 100) / 100 : 0;

    return {
      total,
      byStatus,
      totalPallets,
      avgPalletsPerManifest,
    };
  }
}
