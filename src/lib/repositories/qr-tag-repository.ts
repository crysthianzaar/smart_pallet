import { BaseRepository } from './base-repository';
import { QrTag, QrTagCreate, QrTagUpdate } from '../models';
import { db } from '../database';

export class QrTagRepository extends BaseRepository<QrTag, QrTagCreate, QrTagUpdate> {
  constructor() {
    super('qr_tags');
  }

  async findByQrCode(qrCode: string): Promise<QrTag | null> {
    return this.findOneBy('qr_code', qrCode);
  }

  async findByStatus(status: 'livre' | 'vinculado'): Promise<QrTag[]> {
    return this.findBy('status', status);
  }

  async findAvailable(): Promise<QrTag[]> {
    return this.findByStatus('livre');
  }

  async findLinked(): Promise<QrTag[]> {
    return this.findByStatus('vinculado');
  }

  async linkToPallet(qrTagId: string, palletId: string): Promise<boolean> {
    const stmt = db.prepare(`
      UPDATE ${this.tableName} 
      SET status = 'vinculado', current_pallet_id = ?, updated_at = ?
      WHERE id = ? AND status = 'livre'
    `);
    const result = stmt.run(palletId, this.getCurrentTimestamp(), qrTagId);
    return result.changes > 0;
  }

  async unlinkFromPallet(qrTagId: string): Promise<boolean> {
    const stmt = db.prepare(`
      UPDATE ${this.tableName} 
      SET status = 'livre', current_pallet_id = NULL, updated_at = ?
      WHERE id = ?
    `);
    const result = stmt.run(this.getCurrentTimestamp(), qrTagId);
    return result.changes > 0;
  }

  async getAvailableCount(): Promise<number> {
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = 'livre'`);
    const result = stmt.get() as { count: number };
    return result.count;
  }

  async getLinkedCount(): Promise<number> {
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = 'vinculado'`);
    const result = stmt.get() as { count: number };
    return result.count;
  }
}
