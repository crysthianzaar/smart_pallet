import { SupabasePalletRepository } from './supabase-pallet-repository'
import { SupabaseContractRepository } from './supabase-contract-repository'
import { SupabaseManifestRepository } from './supabase-manifest-repository'
import { SupabaseBaseRepository } from './supabase-base-repository'
import { 
  Location, LocationCreate, LocationUpdate,
  Sku, SkuCreate, SkuUpdate,
  QrTag, QrTagCreate, QrTagUpdate,
  Receipt, ReceiptCreate, ReceiptUpdate,
  Comparison, ComparisonCreate
} from '../models'

// ComparisonUpdate type (since it doesn't exist in models)
type ComparisonUpdate = Partial<ComparisonCreate>

// Repositórios simples que usam apenas o BaseRepository
class SupabaseLocationRepository extends SupabaseBaseRepository<Location, LocationCreate, LocationUpdate> {
  constructor() {
    super('locations')
  }

  async findByType(type: 'origem' | 'destino' | 'estoque'): Promise<Location[]> {
    return this.findBy('type', type)
  }

  async findByContract(contractId: string): Promise<Location[]> {
    return this.findBy('contract_id', contractId)
  }

  async findActive(): Promise<Location[]> {
    return this.findBy('status', 'active')
  }

  async findOrigins(): Promise<Location[]> {
    return this.findBy('type', 'origem')
  }

  async findDestinations(): Promise<Location[]> {
    return this.findBy('type', 'destino')
  }

  async findByStatus(status: 'active' | 'inactive'): Promise<Location[]> {
    return this.findBy('status', status)
  }
}

class SupabaseSkuRepository extends SupabaseBaseRepository<Sku, SkuCreate, SkuUpdate> {
  constructor() {
    super('skus')
  }

  async findByCode(code: string): Promise<Sku | null> {
    return this.findOneBy('code', code)
  }

  async findActive(): Promise<Sku[]> {
    return this.findBy('status', 'active')
  }

  async searchByName(name: string): Promise<Sku[]> {
    const { data, error } = await this.client
      .from('skus')
      .select('*')
      .ilike('name', `%${name}%`)
      .eq('status', 'active')

    if (error) {
      throw new Error(`Error searching SKUs by name: ${error.message}`)
    }

    return data as Sku[]
  }

  async search(searchTerm: string): Promise<Sku[]> {
    const { data, error } = await this.client
      .from('skus')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .eq('status', 'active')
      .order('name')

    if (error) {
      throw new Error(`Error searching SKUs: ${error.message}`)
    }

    return data as Sku[]
  }

  async findByCategory(category: string): Promise<Sku[]> {
    const { data, error } = await this.client
      .from('skus')
      .select('*')
      .eq('category', category)
      .eq('status', 'active')
      .order('name')

    if (error) {
      throw new Error(`Error finding SKUs by category: ${error.message}`)
    }

    return data as Sku[]
  }

  async findByStatus(status: 'active' | 'inactive'): Promise<Sku[]> {
    return this.findBy('status', status)
  }
}

class SupabaseQrTagRepository extends SupabaseBaseRepository<QrTag, QrTagCreate, QrTagUpdate> {
  constructor() {
    super('qr_tags')
  }

  async findByCode(qrCode: string): Promise<QrTag | null> {
    return this.findOneBy('qr_code', qrCode)
  }

  async findByQrCode(qrCode: string): Promise<QrTag | null> {
    return this.findOneBy('qr_code', qrCode)
  }

  async findByStatus(status: 'livre' | 'vinculado'): Promise<QrTag[]> {
    return this.findBy('status', status)
  }

  async findAvailable(): Promise<QrTag[]> {
    return this.findBy('status', 'livre')
  }

  async findLinked(): Promise<QrTag[]> {
    return this.findBy('status', 'vinculado')
  }

  async getAvailableCount(): Promise<number> {
    const { count, error } = await this.client
      .from('qr_tags')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'livre')

    if (error) {
      throw new Error(`Error counting available QR tags: ${error.message}`)
    }

    return count || 0
  }

  async getLinkedCount(): Promise<number> {
    const { count, error } = await this.client
      .from('qr_tags')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'vinculado')

    if (error) {
      throw new Error(`Error counting linked QR tags: ${error.message}`)
    }

    return count || 0
  }

  async linkToPallet(qrTagId: string, palletId: string): Promise<boolean> {
    const { error } = await this.client
      .from('qr_tags')
      .update({
        status: 'vinculado',
        pallet_id: palletId,
        updated_at: this.getCurrentTimestamp()
      })
      .eq('id', qrTagId)

    if (error) {
      throw new Error(`Error linking QR tag to pallet: ${error.message}`)
    }

    return true
  }

  async unlinkFromPallet(qrTagId: string): Promise<boolean> {
    const { error } = await this.client
      .from('qr_tags')
      .update({
        status: 'livre',
        pallet_id: null,
        updated_at: this.getCurrentTimestamp()
      })
      .eq('id', qrTagId)

    if (error) {
      throw new Error(`Error unlinking QR tag from pallet: ${error.message}`)
    }

    return true
  }
}

class SupabaseReceiptRepository extends SupabaseBaseRepository<Receipt, ReceiptCreate, ReceiptUpdate> {
  constructor() {
    super('receipts')
  }

  async findByManifest(manifestId: string): Promise<Receipt[]> {
    return this.findBy('manifest_id', manifestId)
  }

  async findByStatus(status: 'ok' | 'alerta' | 'critico'): Promise<Receipt[]> {
    return this.findBy('status', status)
  }

  async findByPallet(palletId: string): Promise<Receipt[]> {
    return this.findBy('pallet_id', palletId)
  }

  async findAllWithDetails(limit: number = 50, offset: number = 0): Promise<any[]> {
    const { data, error } = await this.client
      .from('receipts')
      .select(`
        *,
        manifests!inner(manifest_number),
        pallets(id)
      `)
      .order('received_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Error finding receipts with details: ${error.message}`)
    }

    return data.map(item => ({
      ...item,
      display_name: `RECEIPT-${item.manifests?.manifest_number || item.manifest_id}`,
      manifest_number: item.manifests?.manifest_number,
      manifests: undefined, // Remove nested object
      pallets: undefined   // Remove nested object
    }))
  }


  async findByDateRange(startDate: Date, endDate: Date): Promise<Receipt[]> {
    const { data, error } = await this.client
      .from('receipts')
      .select('*')
      .gte('received_at', startDate.toISOString())
      .lte('received_at', endDate.toISOString())
      .order('received_at', { ascending: false })

    if (error) {
      throw new Error(`Error finding receipts by date range: ${error.message}`)
    }

    return data as Receipt[]
  }

  async findRecent(days: number = 7): Promise<Receipt[]> {
    const dateLimit = new Date()
    dateLimit.setDate(dateLimit.getDate() - days)

    const { data, error } = await this.client
      .from('receipts')
      .select('*')
      .gte('received_at', dateLimit.toISOString())
      .order('received_at', { ascending: false })

    if (error) {
      throw new Error(`Error finding recent receipts: ${error.message}`)
    }

    return data as Receipt[]
  }

  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    todayCount: number;
    avgConfidence: number;
    criticalCount: number;
  }> {
    const { data, error } = await this.client
      .from('receipts')
      .select('status, received_at')

    if (error) {
      throw new Error(`Error getting receipt statistics: ${error.message}`)
    }

    const receipts = data as Receipt[]
    const today = new Date().toDateString()
    
    const stats = {
      total: receipts.length,
      byStatus: receipts.reduce((acc, receipt) => {
        acc[receipt.status] = (acc[receipt.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      todayCount: receipts.filter(r => new Date(r.received_at).toDateString() === today).length,
      avgConfidence: 0, // Not used anymore
      criticalCount: receipts.filter(r => r.status === 'critico').length
    }

    return stats
  }
}

class SupabaseComparisonRepository extends SupabaseBaseRepository<Comparison, ComparisonCreate, ComparisonUpdate> {
  constructor() {
    super('comparisons')
  }

  async findByReceipt(receiptId: string): Promise<Comparison[]> {
    return this.findBy('receipt_id', receiptId)
  }

  async findByPallet(palletId: string): Promise<Comparison[]> {
    return this.findBy('pallet_id', palletId)
  }

  async findByType(differenceType: 'falta' | 'sobra' | 'avaria' | 'troca'): Promise<Comparison[]> {
    return this.findBy('difference_type', differenceType)
  }

  async findCritical(): Promise<Comparison[]> {
    const { data, error } = await this.client
      .from('comparisons')
      .select('*')
      .or('difference_type.eq.falta,difference_type.eq.avaria')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Error finding critical comparisons: ${error.message}`)
    }

    return data as Comparison[]
  }

  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    critical: number;
  }> {
    try {
      // Get total count
      const { count: total, error: totalError } = await this.client
        .from('comparisons')
        .select('*', { count: 'exact', head: true })

      if (totalError) {
        throw new Error(`Error getting total comparisons: ${totalError.message}`)
      }

      // Get count by status
      const { data: statusData, error: statusError } = await this.client
        .from('comparisons')
        .select('status')

      if (statusError) {
        throw new Error(`Error getting comparisons by status: ${statusError.message}`)
      }

      // Get count by difference type
      const { data: typeData, error: typeError } = await this.client
        .from('comparisons')
        .select('difference_type')

      if (typeError) {
        throw new Error(`Error getting comparisons by type: ${typeError.message}`)
      }

      // Get critical count (falta or avaria)
      const { count: critical, error: criticalError } = await this.client
        .from('comparisons')
        .select('*', { count: 'exact', head: true })
        .or('difference_type.eq.falta,difference_type.eq.avaria')

      if (criticalError) {
        throw new Error(`Error getting critical comparisons: ${criticalError.message}`)
      }

      // Process status counts
      const byStatus: Record<string, number> = {}
      statusData?.forEach(item => {
        const status = item.status || 'unknown'
        byStatus[status] = (byStatus[status] || 0) + 1
      })

      // Process type counts
      const byType: Record<string, number> = {}
      typeData?.forEach(item => {
        const type = item.difference_type || 'unknown'
        byType[type] = (byType[type] || 0) + 1
      })

      return {
        total: total || 0,
        byStatus,
        byType,
        critical: critical || 0
      }
    } catch (error) {
      throw new Error(`Error getting comparison statistics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export class SupabaseRepositoryFactory {
  private static palletRepository: SupabasePalletRepository
  private static contractRepository: SupabaseContractRepository
  private static manifestRepository: SupabaseManifestRepository
  private static locationRepository: SupabaseLocationRepository
  private static skuRepository: SupabaseSkuRepository
  private static qrTagRepository: SupabaseQrTagRepository
  private static receiptRepository: SupabaseReceiptRepository
  private static comparisonRepository: SupabaseComparisonRepository

  static getPalletRepository(): SupabasePalletRepository {
    if (!this.palletRepository) {
      this.palletRepository = new SupabasePalletRepository()
    }
    return this.palletRepository
  }

  static getContractRepository(): SupabaseContractRepository {
    if (!this.contractRepository) {
      this.contractRepository = new SupabaseContractRepository()
    }
    return this.contractRepository
  }

  static getManifestRepository(): SupabaseManifestRepository {
    if (!this.manifestRepository) {
      this.manifestRepository = new SupabaseManifestRepository()
    }
    return this.manifestRepository
  }

  static getLocationRepository(): SupabaseLocationRepository {
    if (!this.locationRepository) {
      this.locationRepository = new SupabaseLocationRepository()
    }
    return this.locationRepository
  }

  static getSkuRepository(): SupabaseSkuRepository {
    if (!this.skuRepository) {
      this.skuRepository = new SupabaseSkuRepository()
    }
    return this.skuRepository
  }

  static getQrTagRepository(): SupabaseQrTagRepository {
    if (!this.qrTagRepository) {
      this.qrTagRepository = new SupabaseQrTagRepository()
    }
    return this.qrTagRepository
  }

  static getReceiptRepository(): SupabaseReceiptRepository {
    if (!this.receiptRepository) {
      this.receiptRepository = new SupabaseReceiptRepository()
    }
    return this.receiptRepository
  }

  static getComparisonRepository(): SupabaseComparisonRepository {
    if (!this.comparisonRepository) {
      this.comparisonRepository = new SupabaseComparisonRepository()
    }
    return this.comparisonRepository
  }
}
