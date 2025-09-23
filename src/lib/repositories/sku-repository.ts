import { BaseRepository } from './base-repository';
import { Sku, SkuCreate, SkuUpdate } from '../models';
import { db } from '../database';

export class SkuRepository extends BaseRepository<Sku, SkuCreate, SkuUpdate> {
  constructor() {
    super('skus');
  }

  async findByCode(code: string): Promise<Sku | null> {
    return this.findOneBy('code', code);
  }

  async findByCategory(category: string): Promise<Sku[]> {
    return this.findBy('category', category);
  }

  async findByStatus(status: 'active' | 'inactive'): Promise<Sku[]> {
    return this.findBy('status', status);
  }

  async findActive(): Promise<Sku[]> {
    return this.findByStatus('active');
  }

  async search(query: string): Promise<Sku[]> {
    const stmt = db.prepare(`
      SELECT * FROM ${this.tableName} 
      WHERE status = 'active' AND (
        code LIKE ? OR 
        name LIKE ? OR 
        description LIKE ?
      )
      ORDER BY name
      LIMIT 50
    `);
    const searchTerm = `%${query}%`;
    return stmt.all(searchTerm, searchTerm, searchTerm) as Sku[];
  }
}
