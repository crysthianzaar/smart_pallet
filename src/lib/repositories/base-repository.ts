import { db } from '../database';
import { randomUUID } from 'crypto';

export abstract class BaseRepository<T, TCreate, TUpdate = Partial<TCreate>> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected generateId(): string {
    return randomUUID();
  }

  protected getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  async findById(id: string): Promise<T | null> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.get(id) as T | undefined;
    return result || null;
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<T[]> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT ? OFFSET ?`);
    return stmt.all(limit, offset) as T[];
  }

  async create(data: TCreate): Promise<T> {
    const id = this.generateId();
    const now = this.getCurrentTimestamp();
    
    const dataWithMeta = {
      id,
      ...data,
      created_at: now,
      updated_at: now,
    };

    const columns = Object.keys(dataWithMeta).join(', ');
    const placeholders = Object.keys(dataWithMeta).map(() => '?').join(', ');
    const values = Object.values(dataWithMeta);

    const stmt = db.prepare(`INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`);
    stmt.run(...values);

    return this.findById(id) as Promise<T>;
  }

  async update(id: string, data: TUpdate): Promise<T | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const dataWithMeta = {
      ...data,
      updated_at: this.getCurrentTimestamp(),
    };

    const updates = Object.keys(dataWithMeta)
      .filter(key => dataWithMeta[key as keyof typeof dataWithMeta] !== undefined)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.keys(dataWithMeta)
      .filter(key => dataWithMeta[key as keyof typeof dataWithMeta] !== undefined)
      .map(key => dataWithMeta[key as keyof typeof dataWithMeta]);

    if (updates.length === 0) return existing;

    const stmt = db.prepare(`UPDATE ${this.tableName} SET ${updates} WHERE id = ?`);
    stmt.run(...values, id);

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async count(): Promise<number> {
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`);
    const result = stmt.get() as { count: number };
    return result.count;
  }

  protected async findBy(column: string, value: any): Promise<T[]> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE ${column} = ?`);
    return stmt.all(value) as T[];
  }

  protected async findOneBy(column: string, value: any): Promise<T | null> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE ${column} = ? LIMIT 1`);
    const result = stmt.get(value) as T | undefined;
    return result || null;
  }
}
