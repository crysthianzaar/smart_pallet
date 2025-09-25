import { supabaseAdmin } from '../supabase'
import { randomUUID } from 'crypto'

export abstract class SupabaseBaseRepository<T, TCreate, TUpdate = Partial<TCreate>> {
  protected tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  protected generateId(): string {
    return randomUUID()
  }

  protected getCurrentTimestamp(): string {
    return new Date().toISOString()
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null
      }
      throw new Error(`Error finding ${this.tableName} by id: ${error.message}`)
    }

    return data as T
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<T[]> {
    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Error finding all ${this.tableName}: ${error.message}`)
    }

    return data as T[]
  }

  async create(data: TCreate): Promise<T> {
    const id = this.generateId()
    const now = this.getCurrentTimestamp()
    
    const dataWithMeta = {
      id,
      ...data,
      created_at: now,
      updated_at: now,
    }

    const { data: result, error } = await supabaseAdmin
      .from(this.tableName)
      .insert(dataWithMeta)
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating ${this.tableName}: ${error.message}`)
    }

    return result as T
  }

  async update(id: string, data: TUpdate): Promise<T | null> {
    const existing = await this.findById(id)
    if (!existing) return null

    const dataWithMeta = {
      ...data,
      updated_at: this.getCurrentTimestamp(),
    }

    const { data: result, error } = await supabaseAdmin
      .from(this.tableName)
      .update(dataWithMeta)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating ${this.tableName}: ${error.message}`)
    }

    return result as T
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from(this.tableName)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Error deleting ${this.tableName}: ${error.message}`)
    }

    return true
  }

  async count(): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })

    if (error) {
      throw new Error(`Error counting ${this.tableName}: ${error.message}`)
    }

    return count || 0
  }

  protected async findBy(column: string, value: any): Promise<T[]> {
    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .select('*')
      .eq(column, value)

    if (error) {
      throw new Error(`Error finding ${this.tableName} by ${column}: ${error.message}`)
    }

    return data as T[]
  }

  protected async findOneBy(column: string, value: any): Promise<T | null> {
    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .select('*')
      .eq(column, value)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null
      }
      throw new Error(`Error finding ${this.tableName} by ${column}: ${error.message}`)
    }

    return data as T
  }

  // Método auxiliar para queries customizadas
  protected get client() {
    return supabaseAdmin
  }
}
