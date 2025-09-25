import { SupabaseBaseRepository } from './supabase-base-repository'
import { Pallet, PalletCreate, PalletUpdate, PalletItem, PalletPhoto } from '../models'

export class SupabasePalletRepository extends SupabaseBaseRepository<Pallet, PalletCreate, PalletUpdate> {
  constructor() {
    super('pallets')
  }

  // Sobrescreve o método generateId para usar o formato CTX-DDMMYYYYHHMMSS
  protected generateId(): string {
    const now = new Date()
    
    const day = now.getDate().toString().padStart(2, '0')
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const year = now.getFullYear().toString()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const seconds = now.getSeconds().toString().padStart(2, '0')
    
    return `CTX-${day}${month}${year}${hours}${minutes}${seconds}`
  }

  async findByQrTag(qrTagId: string): Promise<Pallet | null> {
    return this.findOneBy('qr_tag_id', qrTagId)
  }

  async findByStatus(status: string): Promise<Pallet[]> {
    const { data, error } = await this.client
      .from('pallets')
      .select(`
        *,
        contracts!inner(name, company),
        origin_location:locations!pallets_origin_location_id_fkey(name),
        destination_location:locations!pallets_destination_location_id_fkey(name),
        qr_tags!pallets_qr_tag_id_fkey(qr_code)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Error finding pallets by status: ${error.message}`)
    }

    // Flatten the nested data
    return data.map(item => ({
      ...item,
      contract_name: item.contracts?.name,
      contract_company: item.contracts?.company,
      origin_name: item.origin_location?.name,
      destination_name: item.destination_location?.name,
      qr_code: item.qr_tags?.qr_code,
      // Remove nested objects
      contracts: undefined,
      origin_location: undefined,
      destination_location: undefined,
      qr_tags: undefined,
    })) as Pallet[]
  }

  async findByContract(contractId: string): Promise<Pallet[]> {
    return this.findBy('contract_id', contractId)
  }

  async findSealed(): Promise<Pallet[]> {
    return this.findByStatus('em_manifesto')
  }

  async findInTransport(): Promise<Pallet[]> {
    return this.findByStatus('em_transito')
  }

  async findRequiringManualReview(): Promise<Pallet[]> {
    const { data, error } = await this.client
      .from('pallets')
      .select(`
        *,
        contracts!inner(name, company),
        origin_location:locations!pallets_origin_location_id_fkey(name),
        destination_location:locations!pallets_destination_location_id_fkey(name),
        qr_tags!pallets_qr_tag_id_fkey(qr_code)
      `)
      .eq('requires_manual_review', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Error finding pallets requiring manual review: ${error.message}`)
    }

    // Flatten the nested data
    return data.map(item => ({
      ...item,
      contract_name: item.contracts?.name,
      contract_company: item.contracts?.company,
      origin_name: item.origin_location?.name,
      destination_name: item.destination_location?.name,
      qr_code: item.qr_tags?.qr_code,
      // Remove nested objects
      contracts: undefined,
      origin_location: undefined,
      destination_location: undefined,
      qr_tags: undefined,
    })) as Pallet[]
  }

  async seal(palletId: string, sealedBy: string): Promise<boolean> {
    const { error } = await this.client
      .from('pallets')
      .update({
        status: 'em_manifesto',
        sealed_at: this.getCurrentTimestamp(),
        sealed_by: sealedBy,
        updated_at: this.getCurrentTimestamp()
      })
      .eq('id', palletId)
      .eq('status', 'ativo')

    if (error) {
      throw new Error(`Error sealing pallet: ${error.message}`)
    }

    return true
  }

  async setInTransport(palletId: string): Promise<boolean> {
    const { error } = await this.client
      .from('pallets')
      .update({
        status: 'em_transito',
        updated_at: this.getCurrentTimestamp()
      })
      .eq('id', palletId)
      .eq('status', 'em_manifesto')

    if (error) {
      throw new Error(`Error setting pallet in transport: ${error.message}`)
    }

    return true
  }

  async receive(palletId: string): Promise<boolean> {
    const { error } = await this.client
      .from('pallets')
      .update({
        status: 'recebido',
        updated_at: this.getCurrentTimestamp()
      })
      .eq('id', palletId)
      .eq('status', 'em_transito')

    if (error) {
      throw new Error(`Error receiving pallet: ${error.message}`)
    }

    return true
  }

  async findAllWithDetails(limit: number = 50, offset: number = 0): Promise<Pallet[]> {
    const { data, error } = await this.client
      .from('pallets')
      .select(`
        *,
        contracts!inner(name, company),
        origin_location:locations!pallets_origin_location_id_fkey(name),
        destination_location:locations!pallets_destination_location_id_fkey(name),
        qr_tags!pallets_qr_tag_id_fkey(qr_code)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Error finding pallets with details: ${error.message}`)
    }

    // Flatten the nested data
    return data.map(item => ({
      ...item,
      contract_name: item.contracts?.name,
      contract_company: item.contracts?.company,
      origin_name: item.origin_location?.name,
      destination_name: item.destination_location?.name,
      qr_code: item.qr_tags?.qr_code,
      // Remove nested objects
      contracts: undefined,
      origin_location: undefined,
      destination_location: undefined,
      qr_tags: undefined,
    })) as Pallet[]
  }

  async getWithDetails(palletId: string): Promise<{
    pallet: Pallet;
    items: PalletItem[];
    photos: PalletPhoto[];
  } | null> {
    // Get pallet with related data
    const { data: palletData, error: palletError } = await this.client
      .from('pallets')
      .select(`
        *,
        contracts!inner(name, company),
        origin_location:locations!pallets_origin_location_id_fkey(name),
        destination_location:locations!pallets_destination_location_id_fkey(name),
        qr_tags!pallets_qr_tag_id_fkey(qr_code)
      `)
      .eq('id', palletId)
      .single()

    if (palletError) {
      if (palletError.code === 'PGRST116') {
        return null
      }
      throw new Error(`Error getting pallet details: ${palletError.message}`)
    }

    // Flatten pallet data
    const pallet = {
      ...palletData,
      contract_name: palletData.contracts?.name,
      contract_company: palletData.contracts?.company,
      origin_name: palletData.origin_location?.name,
      destination_name: palletData.destination_location?.name,
      qr_code: palletData.qr_tags?.qr_code,
      // Remove nested objects
      contracts: undefined,
      origin_location: undefined,
      destination_location: undefined,
      qr_tags: undefined,
    } as Pallet

    // Get pallet items
    const { data: itemsData, error: itemsError } = await this.client
      .from('pallet_items')
      .select(`
        *,
        skus!inner(name, code)
      `)
      .eq('pallet_id', palletId)

    if (itemsError) {
      throw new Error(`Error getting pallet items: ${itemsError.message}`)
    }

    const items = itemsData.map(item => ({
      ...item,
      sku_name: item.skus?.name,
      sku_code: item.skus?.code,
      skus: undefined,
    })) as PalletItem[]

    // Get pallet photos
    const { data: photosData, error: photosError } = await this.client
      .from('pallet_photos')
      .select('*')
      .eq('pallet_id', palletId)
      .order('photo_type')
      .order('stage')

    if (photosError) {
      throw new Error(`Error getting pallet photos: ${photosError.message}`)
    }

    const photos = photosData as PalletPhoto[]

    return { pallet, items, photos }
  }

  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    requiresManualReview: number;
    avgConfidence: number;
  }> {
    // Get total count
    const { count: total, error: totalError } = await this.client
      .from('pallets')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      throw new Error(`Error getting total pallets count: ${totalError.message}`)
    }

    // Get count by status
    const { data: statusData, error: statusError } = await this.client
      .from('pallets')
      .select('status')

    if (statusError) {
      throw new Error(`Error getting pallets by status: ${statusError.message}`)
    }

    const byStatus = statusData.reduce((acc, { status }) => {
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get manual review count
    const { count: requiresManualReview, error: reviewError } = await this.client
      .from('pallets')
      .select('*', { count: 'exact', head: true })
      .eq('requires_manual_review', true)

    if (reviewError) {
      throw new Error(`Error getting manual review count: ${reviewError.message}`)
    }

    // Get average confidence
    const { data: confidenceData, error: confidenceError } = await this.client
      .from('pallets')
      .select('ai_confidence')
      .not('ai_confidence', 'is', null)

    if (confidenceError) {
      throw new Error(`Error getting confidence data: ${confidenceError.message}`)
    }

    const avgConfidence = confidenceData.length > 0
      ? confidenceData.reduce((sum, { ai_confidence }) => sum + (ai_confidence || 0), 0) / confidenceData.length
      : 0

    return {
      total: total || 0,
      byStatus,
      requiresManualReview: requiresManualReview || 0,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
    }
  }
}
