import { BaseRepository } from './base-repository';
import { Contract, ContractCreate, ContractUpdate } from '../models';

export class ContractRepository extends BaseRepository<Contract, ContractCreate, ContractUpdate> {
  constructor() {
    super('contracts');
  }

  async findByStatus(status: 'active' | 'inactive'): Promise<Contract[]> {
    return this.findBy('status', status);
  }

  async findByCompany(company: string): Promise<Contract[]> {
    return this.findBy('company', company);
  }

  async findActive(): Promise<Contract[]> {
    return this.findByStatus('active');
  }
}
