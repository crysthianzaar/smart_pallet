import { SupabaseBaseRepository } from './supabase-base-repository'
import { Contract, ContractCreate, ContractUpdate } from '../models'

export class SupabaseContractRepository extends SupabaseBaseRepository<Contract, ContractCreate, ContractUpdate> {
  constructor() {
    super('contracts')
  }

  async findByStatus(status: 'active' | 'inactive'): Promise<Contract[]> {
    return this.findBy('status', status)
  }

  async findActive(): Promise<Contract[]> {
    return this.findByStatus('active')
  }

  async findByName(name: string): Promise<Contract[]> {
    const { data, error } = await this.client
      .from('contracts')
      .select('*')
      .ilike('name', `%${name}%`)

    if (error) {
      throw new Error(`Error finding contracts by name: ${error.message}`)
    }

    return data as Contract[]
  }

  async findByCompany(company: string): Promise<Contract[]> {
    const { data, error } = await this.client
      .from('contracts')
      .select('*')
      .ilike('company', `%${company}%`)

    if (error) {
      throw new Error(`Error finding contracts by company: ${error.message}`)
    }

    return data as Contract[]
  }

  async deactivate(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('contracts')
      .update({
        status: 'inactive',
        updated_at: this.getCurrentTimestamp()
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Error deactivating contract: ${error.message}`)
    }

    return true
  }

  async activate(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('contracts')
      .update({
        status: 'active',
        updated_at: this.getCurrentTimestamp()
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Error activating contract: ${error.message}`)
    }

    return true
  }
}
