import { SupabaseBaseRepository } from './supabase-base-repository'
import { Manifest, ManifestCreate, ManifestUpdate } from '../models'

export class SupabaseManifestRepository extends SupabaseBaseRepository<Manifest, ManifestCreate, ManifestUpdate> {
  constructor() {
    super('manifests')
  }

  async findByStatus(status: string): Promise<Manifest[]> {
    return this.findBy('status', status)
  }

  async findByContract(contractId: string): Promise<Manifest[]> {
    return this.findBy('contract_id', contractId)
  }

  async findDrafts(): Promise<Manifest[]> {
    return this.findByStatus('rascunho')
  }

  async findInTransit(): Promise<Manifest[]> {
    return this.findByStatus('em_transito')
  }

  async getWithDetails(manifestId: string): Promise<{
    manifest: Manifest;
    pallets: any[];
    contract?: any;
    originLocation?: any;
    destinationLocation?: any;
  } | null> {
    // Get manifest with related data
    const { data: manifestData, error: manifestError } = await this.client
      .from('manifests')
      .select(`
        *,
        contracts!inner(id, name, company, contact_email, contact_phone, status),
        origin_location:locations!manifests_origin_location_id_fkey(id, name, type, address, city, state, postal_code),
        destination_location:locations!manifests_destination_location_id_fkey(id, name, type, address, city, state, postal_code)
      `)
      .eq('id', manifestId)
      .single()

    if (manifestError) {
      if (manifestError.code === 'PGRST116') {
        return null
      }
      throw new Error(`Error getting manifest details: ${manifestError.message}`)
    }

    // Flatten manifest data
    const manifest = {
      ...manifestData,
      contract_name: manifestData.contracts?.name,
      contract_company: manifestData.contracts?.company,
      origin_name: manifestData.origin_location?.name,
      destination_name: manifestData.destination_location?.name,
      // Remove nested objects
      contracts: undefined,
      origin_location: undefined,
      destination_location: undefined,
    } as Manifest

    // Get manifest pallets
    const { data: palletsData, error: palletsError } = await this.client
      .from('manifest_pallets')
      .select(`
        *,
        pallets!inner(
          id,
          qr_tag_id,
          status,
          qr_tags!pallets_qr_tag_id_fkey(qr_code)
        )
      `)
      .eq('manifest_id', manifestId)

    if (palletsError) {
      throw new Error(`Error getting manifest pallets: ${palletsError.message}`)
    }

    const pallets = palletsData.map(item => ({
      ...item.pallets,
      qr_code: item.pallets?.qr_tags?.qr_code,
      added_at: item.added_at,
      qr_tags: undefined,
    }))

    return { 
      manifest, 
      pallets,
      contract: manifestData.contracts,
      originLocation: manifestData.origin_location,
      destinationLocation: manifestData.destination_location
    }
  }

  async addPallet(manifestId: string, palletId: string): Promise<boolean> {
    const { error } = await this.client
      .from('manifest_pallets')
      .insert({
        manifest_id: manifestId,
        pallet_id: palletId,
        added_at: this.getCurrentTimestamp()
      })

    if (error) {
      throw new Error(`Error adding pallet to manifest: ${error.message}`)
    }

    // Update pallet status
    const { error: palletError } = await this.client
      .from('pallets')
      .update({
        status: 'em_manifesto',
        manifest_id: manifestId,
        updated_at: this.getCurrentTimestamp()
      })
      .eq('id', palletId)

    if (palletError) {
      throw new Error(`Error updating pallet status: ${palletError.message}`)
    }

    return true
  }

  async removePallet(manifestId: string, palletId: string): Promise<boolean> {
    const { error } = await this.client
      .from('manifest_pallets')
      .delete()
      .eq('manifest_id', manifestId)
      .eq('pallet_id', palletId)

    if (error) {
      throw new Error(`Error removing pallet from manifest: ${error.message}`)
    }

    // Update pallet status back to active
    const { error: palletError } = await this.client
      .from('pallets')
      .update({
        status: 'ativo',
        manifest_id: null,
        updated_at: this.getCurrentTimestamp()
      })
      .eq('id', palletId)

    if (palletError) {
      throw new Error(`Error updating pallet status: ${palletError.message}`)
    }

    return true
  }

  async markAsLoaded(manifestId: string, driverName?: string, vehiclePlate?: string): Promise<boolean> {
    const updateData: any = {
      status: 'carregado',
      departure_date: this.getCurrentTimestamp(),
      updated_at: this.getCurrentTimestamp()
    }

    if (driverName) updateData.driver_name = driverName
    if (vehiclePlate) updateData.vehicle_plate = vehiclePlate

    const { error } = await this.client
      .from('manifests')
      .update(updateData)
      .eq('id', manifestId)
      .eq('status', 'rascunho')

    if (error) {
      throw new Error(`Error marking manifest as loaded: ${error.message}`)
    }

    // Update all pallets in this manifest to in_transit
    const { error: palletsError } = await this.client
      .from('pallets')
      .update({
        status: 'em_transito',
        updated_at: this.getCurrentTimestamp()
      })
      .eq('manifest_id', manifestId)

    if (palletsError) {
      throw new Error(`Error updating pallets status to in transit: ${palletsError.message}`)
    }

    return true
  }

  async markAsInTransit(manifestId: string): Promise<boolean> {
    const { error } = await this.client
      .from('manifests')
      .update({
        status: 'em_transito',
        updated_at: this.getCurrentTimestamp()
      })
      .eq('id', manifestId)
      .eq('status', 'carregado')

    if (error) {
      throw new Error(`Error marking manifest as in transit: ${error.message}`)
    }

    return true
  }

  async markAsDelivered(manifestId: string): Promise<boolean> {
    const { error } = await this.client
      .from('manifests')
      .update({
        status: 'entregue',
        arrival_date: this.getCurrentTimestamp(),
        updated_at: this.getCurrentTimestamp()
      })
      .eq('id', manifestId)
      .eq('status', 'em_transito')

    if (error) {
      throw new Error(`Error marking manifest as delivered: ${error.message}`)
    }

    return true
  }

  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    totalPallets: number;
    avgPalletsPerManifest: number;
  }> {
    // Get total count
    const { count: total, error: totalError } = await this.client
      .from('manifests')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      throw new Error(`Error getting total manifests count: ${totalError.message}`)
    }

    // Get count by status
    const { data: statusData, error: statusError } = await this.client
      .from('manifests')
      .select('status')

    if (statusError) {
      throw new Error(`Error getting manifests by status: ${statusError.message}`)
    }

    const byStatus = statusData.reduce((acc, { status }) => {
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get total pallets in manifests
    const { count: totalPallets, error: palletsError } = await this.client
      .from('manifest_pallets')
      .select('*', { count: 'exact', head: true })

    if (palletsError) {
      throw new Error(`Error getting total pallets in manifests: ${palletsError.message}`)
    }

    const avgPalletsPerManifest = total && totalPallets 
      ? Math.round((totalPallets / total) * 100) / 100
      : 0

    return {
      total: total || 0,
      byStatus,
      totalPallets: totalPallets || 0,
      avgPalletsPerManifest,
    }
  }
}
