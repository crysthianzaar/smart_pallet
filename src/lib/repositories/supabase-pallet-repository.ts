import { SupabaseBaseRepository } from './supabase-base-repository'
import { 
  Pallet, 
  PalletCreate, 
  PalletUpdate, 
  PalletItem, 
  PalletPhoto,
  PalletPhotoCreate,
  VisionAnalysis,
  VisionAnalysisCreate,
  SelectedSku,
  SelectedSkuCreate,
  PalletCreateWithDetails
} from '../models'

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

  // Enhanced create method with all related data
  async createWithDetails(data: PalletCreateWithDetails, createdBy: string): Promise<{
    pallet: Pallet;
    selectedSkus?: SelectedSku[];
    photos?: PalletPhoto[];
  }> {
    // Start transaction-like operations
    const palletId = this.generateId()
    const timestamp = this.getCurrentTimestamp()

    // Calculate total expected items
    const totalExpectedItems = data.selected_skus?.reduce((sum, sku) => sum + sku.expected_quantity, 0) || 0

    // Create the pallet
    const palletData: PalletCreate = {
      qr_tag_id: data.qr_tag_id,
      contract_id: data.contract_id,
      origin_location_id: data.origin_location_id,
      destination_location_id: data.destination_location_id,
      status: 'ativo',
      total_expected_items: totalExpectedItems,
      requires_manual_review: false,
      created_by: createdBy,
    }

    const pallet = await this.create(palletData)

    let selectedSkus: SelectedSku[] = []
    let photos: PalletPhoto[] = []

    // Save selected SKUs if provided
    if (data.selected_skus && data.selected_skus.length > 0) {
      const selectedSkusData: SelectedSkuCreate[] = data.selected_skus.map(sku => ({
        pallet_id: pallet.id,
        sku_id: sku.sku_id,
        expected_quantity: sku.expected_quantity,
      }))
      selectedSkus = await this.saveSelectedSkus(selectedSkusData)
      console.log(`✅ ${selectedSkus.length} SKUs selecionados salvos para o pallet ${pallet.id}`)
    }

    // Save photos if provided
    if (data.photos && data.photos.length > 0) {
      const photosData: PalletPhotoCreate[] = data.photos.map(photo => ({
        pallet_id: pallet.id,
        photo_type: photo.photo_type,
        stage: photo.stage,
        file_path: photo.file_path,
      }))
      photos = await this.savePhotos(photosData)
    }

    return { pallet, selectedSkus, photos }
  }

  // Save photos method
  async savePhotos(photos: PalletPhotoCreate[]): Promise<PalletPhoto[]> {
    if (photos.length === 0) return []

    const { uploadBase64ToSupabase } = await import('../supabase-storage')
    const timestamp = this.getCurrentTimestamp()
    
    // Process each photo to upload to Supabase Storage
    const processedPhotos = []
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      let finalFilePath = photo.file_path

      // If file_path is base64 data URL, upload to Supabase Storage
      if (photo.file_path.startsWith('data:image/')) {
          const fileName = `pallets/${Date.now()}_${i + 1}_${photo.photo_type}_${photo.stage}.jpg`
          try {
            finalFilePath = await uploadBase64ToSupabase(photo.file_path, fileName)
            console.log(`✅ Photo ${i + 1} uploaded to Supabase Storage`)
          } catch (uploadError) {
            console.error(`❌ Failed to upload photo ${i + 1}:`, uploadError)
            throw new Error(`Failed to upload photo to Supabase Storage: ${(uploadError as Error).message}`)
          }
        }

        processedPhotos.push({
          id: crypto.randomUUID(), // Use UUID for pallet_photos table
          ...photo,
          file_path: finalFilePath, // Use Supabase URL instead of base64
          created_at: timestamp
        })
    }

    const { data, error } = await this.client
      .from('pallet_photos')
      .insert(processedPhotos)
      .select()

    if (error) {
      throw new Error(`Error saving photos: ${error.message}`)
    }

    console.log(`✅ ${data.length} photos saved to database`)
    return data as PalletPhoto[]
  }

  // Selected SKUs methods
  async saveSelectedSkus(selectedSkus: SelectedSkuCreate[]): Promise<SelectedSku[]> {
    if (selectedSkus.length === 0) return []

    const timestamp = this.getCurrentTimestamp()
    const skusWithTimestamp = selectedSkus.map(sku => ({
      ...sku,
      created_at: timestamp
    }))

    const { data, error } = await this.client
      .from('selected_skus')
      .insert(skusWithTimestamp)
      .select()

    if (error) {
      throw new Error(`Error saving selected SKUs: ${error.message}`)
    }

    return data as SelectedSku[]
  }

  async getSelectedSkus(palletId: string): Promise<SelectedSku[]> {
    console.log(`🔍 Getting selected SKUs for pallet: ${palletId}`)
    
    const { data, error } = await this.client
      .from('selected_skus')
      .select(`
        *,
        skus(code, name, description, unit, weight, dimensions)
      `)
      .eq('pallet_id', palletId)

    if (error) {
      console.error('❌ Error getting selected SKUs:', error)
      // Don't throw error, just return empty array if table doesn't exist
      if (error.code === '42P01') {
        console.warn('⚠️ selected_skus table does not exist - migrations may not have been run')
        return []
      }
      // Return empty array for other errors too, don't break the flow
      console.warn('⚠️ Could not get selected SKUs, returning empty array')
      return []
    }

    console.log(`✅ Selected SKUs raw data:`, data)

    const result = (data || []).map(item => ({
      ...item,
      sku_code: item.skus?.code,
      sku_name: item.skus?.name,
      sku_description: item.skus?.description,
      sku_unit: item.skus?.unit,
      sku_weight: item.skus?.weight,
      sku_dimensions: item.skus?.dimensions,
      skus: undefined,
    })) as SelectedSku[]

    console.log(`✅ Selected SKUs processed: ${result.length} SKUs`)
    return result
  }

  // Vision Analysis methods
  async saveVisionAnalysis(visionAnalysis: VisionAnalysisCreate): Promise<VisionAnalysis> {
    // Use crypto.randomUUID() for vision_analyses table instead of custom format
    const id = crypto.randomUUID()
    const timestamp = this.getCurrentTimestamp()
    
    const { data, error } = await this.client
      .from('vision_analyses')
      .insert({
        id,
        ...visionAnalysis,
        created_at: timestamp
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Error saving vision analysis: ${error.message}`)
    }

    return data as VisionAnalysis
  }

  async getVisionAnalysis(palletId: string): Promise<VisionAnalysis | null> {
    console.log(`🔍 Getting vision analysis for pallet: ${palletId}`)
    
    const { data, error } = await this.client
      .from('vision_analyses')
      .select('*')
      .eq('pallet_id', palletId)
      .single()

    if (error) {
      console.error('❌ Error getting vision analysis:', error)
      if (error.code === 'PGRST116') {
        console.log('ℹ️ No vision analysis found for this pallet')
        return null
      }
      if (error.code === '42P01') {
        console.warn('⚠️ vision_analyses table does not exist - migrations may not have been run')
        return null
      }
      // Return null for other errors too, don't break the flow
      console.warn('⚠️ Could not get vision analysis, returning null')
      return null
    }

    console.log('✅ Vision analysis found:', data)
    return data as VisionAnalysis
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
    visionAnalysis?: VisionAnalysis | null;
    selectedSkus?: SelectedSku[];
  } | null> {
    console.log(`🔍 Getting details for pallet: ${palletId}`)
    
    // Get basic pallet data first
    const { data: palletData, error: palletError } = await this.client
      .from('pallets')
      .select('*')
      .eq('id', palletId)
      .single()

    if (palletError) {
      console.error('❌ Error getting pallet data:', palletError)
      if (palletError.code === 'PGRST116') {
        return null
      }
      throw new Error(`Error getting pallet details: ${palletError.message}`)
    }

    console.log('✅ Pallet data retrieved:', palletData)

    // Get related data separately to avoid relationship conflicts
    let contractData = null
    let originLocationData = null
    let destinationLocationData = null
    let qrTagData = null

    // Get contract data
    if (palletData.contract_id) {
      const { data: contract } = await this.client
        .from('contracts')
        .select('name, company')
        .eq('id', palletData.contract_id)
        .single()
      contractData = contract
    }

    // Get origin location data
    if (palletData.origin_location_id) {
      const { data: originLocation } = await this.client
        .from('locations')
        .select('name')
        .eq('id', palletData.origin_location_id)
        .single()
      originLocationData = originLocation
    }

    // Get destination location data
    if (palletData.destination_location_id) {
      const { data: destinationLocation } = await this.client
        .from('locations')
        .select('name')
        .eq('id', palletData.destination_location_id)
        .single()
      destinationLocationData = destinationLocation
    }

    // Get QR tag data
    if (palletData.qr_tag_id) {
      const { data: qrTag } = await this.client
        .from('qr_tags')
        .select('qr_code')
        .eq('id', palletData.qr_tag_id)
        .single()
      qrTagData = qrTag
    }

    // Get selected SKUs
    const selectedSkus = await this.getSelectedSkus(palletId)
    console.log(`✅ Selected SKUs retrieved: ${selectedSkus.length} SKUs`)

    // Flatten pallet data and include all related data
    const pallet = {
      ...palletData,
      contract_name: contractData?.name,
      contract_company: contractData?.company,
      origin_name: originLocationData?.name,
      destination_name: destinationLocationData?.name,
      qr_code: qrTagData?.qr_code,
      // Don't add selected_skus here - they're returned separately
    } as Pallet

    // Get pallet items
    const { data: itemsData, error: itemsError } = await this.client
      .from('pallet_items')
      .select(`
        *,
        skus(name, code, description, unit, weight, dimensions)
      `)
      .eq('pallet_id', palletId)

    if (itemsError) {
      console.error('❌ Error getting pallet items:', itemsError)
      // Don't throw error, just return empty array
      console.log('ℹ️ No pallet items found or table does not exist')
    }

    const items = (itemsData || []).map(item => ({
      ...item,
      sku_name: item.skus?.name,
      sku_code: item.skus?.code,
      sku_description: item.skus?.description,
      sku_unit: item.skus?.unit,
      sku_weight: item.skus?.weight,
      sku_dimensions: item.skus?.dimensions,
      skus: undefined,
    })) as PalletItem[]

    console.log(`✅ Pallet items retrieved: ${items.length} items`)

    // Get pallet photos
    const { data: photosData, error: photosError } = await this.client
      .from('pallet_photos')
      .select('*')
      .eq('pallet_id', palletId)
      .order('photo_type')
      .order('stage')

    if (photosError) {
      console.error('❌ Error getting pallet photos:', photosError)
      // Don't throw error, just return empty array
      console.log('ℹ️ No pallet photos found or table does not exist')
    }

    const photos = (photosData || []) as PalletPhoto[]
    console.log(`✅ Pallet photos retrieved: ${photos.length} photos`)

    // Get vision analysis
    const visionAnalysis = await this.getVisionAnalysis(palletId)
    console.log('✅ Vision analysis retrieved:', visionAnalysis ? 'Found' : 'Not found')

    const result = { pallet, items, photos, visionAnalysis, selectedSkus }
    console.log('📦 Final result summary:', {
      pallet_id: result.pallet.id,
      items_count: result.items.length,
      photos_count: result.photos.length,
      has_vision_analysis: !!result.visionAnalysis,
      selected_skus_count: result.selectedSkus.length,
      pallet_destination_name: (result.pallet as any).destination_name,
      pallet_qr_code: (result.pallet as any).qr_code
    })

    return result
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
