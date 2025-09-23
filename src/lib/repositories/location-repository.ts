import { BaseRepository } from './base-repository';
import { Location, LocationCreate, LocationUpdate } from '../models';
import { db } from '../database';

export class LocationRepository extends BaseRepository<Location, LocationCreate, LocationUpdate> {
  constructor() {
    super('locations');
  }

  async findByType(type: 'origem' | 'destino' | 'estoque'): Promise<Location[]> {
    return this.findBy('type', type);
  }

  async findByContract(contractId: string): Promise<Location[]> {
    return this.findBy('contract_id', contractId);
  }

  async findByStatus(status: 'active' | 'inactive'): Promise<Location[]> {
    return this.findBy('status', status);
  }

  async findActive(): Promise<Location[]> {
    return this.findByStatus('active');
  }

  async findOrigins(): Promise<Location[]> {
    const stmt = db.prepare(`
      SELECT * FROM ${this.tableName} 
      WHERE type = 'origem' AND status = 'active'
      ORDER BY name
    `);
    return stmt.all() as Location[];
  }

  async findDestinations(): Promise<Location[]> {
    const stmt = db.prepare(`
      SELECT * FROM ${this.tableName} 
      WHERE type = 'destino' AND status = 'active'
      ORDER BY name
    `);
    return stmt.all() as Location[];
  }
}
