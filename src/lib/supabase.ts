import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente para uso no servidor (com service role key se necessário)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase

export type Database = {
  public: {
    Tables: {
      contracts: {
        Row: {
          id: string
          name: string
          company: string
          contact_email: string | null
          contact_phone: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          company: string
          contact_email?: string | null
          contact_phone?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          company?: string
          contact_email?: string | null
          contact_phone?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          type: 'origem' | 'destino' | 'estoque'
          address: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          contract_id: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'origem' | 'destino' | 'estoque'
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          contract_id?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'origem' | 'destino' | 'estoque'
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          contract_id?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      skus: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          unit: string
          unit_price: number | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          unit: string
          unit_price?: number | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          unit?: string
          unit_price?: number | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      qr_tags: {
        Row: {
          id: string
          qr_code: string
          status: 'livre' | 'vinculado'
          description: string | null
          pallet_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          qr_code: string
          status?: 'livre' | 'vinculado'
          description?: string | null
          pallet_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          qr_code?: string
          status?: 'livre' | 'vinculado'
          description?: string | null
          pallet_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pallets: {
        Row: {
          id: string
          qr_tag_id: string
          contract_id: string
          origin_location_id: string
          destination_location_id: string | null
          status: 'ativo' | 'em_manifesto' | 'em_transito' | 'recebido' | 'finalizado'
          ai_confidence: number | null
          requires_manual_review: boolean
          manifest_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          qr_tag_id: string
          contract_id: string
          origin_location_id: string
          destination_location_id?: string | null
          status?: 'ativo' | 'em_manifesto' | 'em_transito' | 'recebido' | 'finalizado'
          ai_confidence?: number | null
          requires_manual_review?: boolean
          manifest_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          qr_tag_id?: string
          contract_id?: string
          origin_location_id?: string
          destination_location_id?: string | null
          status?: 'ativo' | 'em_manifesto' | 'em_transito' | 'recebido' | 'finalizado'
          ai_confidence?: number | null
          requires_manual_review?: boolean
          manifest_id?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      pallet_items: {
        Row: {
          id: string
          pallet_id: string
          sku_id: string
          quantity_origin: number
          quantity_destination: number | null
          manual_count_origin: number | null
          manual_count_destination: number | null
          ai_confidence: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pallet_id: string
          sku_id: string
          quantity_origin: number
          quantity_destination?: number | null
          manual_count_origin?: number | null
          manual_count_destination?: number | null
          ai_confidence?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pallet_id?: string
          sku_id?: string
          quantity_origin?: number
          quantity_destination?: number | null
          manual_count_origin?: number | null
          manual_count_destination?: number | null
          ai_confidence?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      pallet_photos: {
        Row: {
          id: string
          pallet_id: string
          photo_type: 'frontal' | 'lateral' | 'superior'
          stage: 'origem' | 'destino'
          file_path: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          pallet_id: string
          photo_type: 'frontal' | 'lateral' | 'superior'
          stage: 'origem' | 'destino'
          file_path: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          pallet_id?: string
          photo_type?: 'frontal' | 'lateral' | 'superior'
          stage?: 'origem' | 'destino'
          file_path?: string
          uploaded_at?: string
        }
      }
      manifests: {
        Row: {
          id: string
          manifest_number: string
          contract_id: string
          origin_location_id: string
          destination_location_id: string
          status: 'rascunho' | 'carregado' | 'em_transito' | 'entregue'
          departure_date: string | null
          arrival_date: string | null
          driver_name: string | null
          vehicle_plate: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          manifest_number: string
          contract_id: string
          origin_location_id: string
          destination_location_id: string
          status?: 'rascunho' | 'carregado' | 'em_transito' | 'entregue'
          departure_date?: string | null
          arrival_date?: string | null
          driver_name?: string | null
          vehicle_plate?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          manifest_number?: string
          contract_id?: string
          origin_location_id?: string
          destination_location_id?: string
          status?: 'rascunho' | 'carregado' | 'em_transito' | 'entregue'
          departure_date?: string | null
          arrival_date?: string | null
          driver_name?: string | null
          vehicle_plate?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      manifest_pallets: {
        Row: {
          id: string
          manifest_id: string
          pallet_id: string
          added_at: string
        }
        Insert: {
          id?: string
          manifest_id: string
          pallet_id: string
          added_at?: string
        }
        Update: {
          id?: string
          manifest_id?: string
          pallet_id?: string
          added_at?: string
        }
      }
      receipts: {
        Row: {
          id: string
          manifest_id: string
          pallet_id: string | null
          received_by: string
          received_at: string
          status: 'ok' | 'alerta' | 'critico'
          observations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          manifest_id: string
          pallet_id?: string | null
          received_by: string
          received_at: string
          status: 'ok' | 'alerta' | 'critico'
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          manifest_id?: string
          pallet_id?: string | null
          received_by?: string
          received_at?: string
          status?: 'ok' | 'alerta' | 'critico'
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comparisons: {
        Row: {
          id: string
          receipt_id: string
          pallet_id: string
          sku_id: string
          quantity_origin: number
          quantity_destination: number
          difference: number
          difference_type: 'falta' | 'sobra' | 'avaria' | 'troca'
          created_at: string
        }
        Insert: {
          id?: string
          receipt_id: string
          pallet_id: string
          sku_id: string
          quantity_origin: number
          quantity_destination: number
          difference: number
          difference_type: 'falta' | 'sobra' | 'avaria' | 'troca'
          created_at?: string
        }
        Update: {
          id?: string
          receipt_id?: string
          pallet_id?: string
          sku_id?: string
          quantity_origin?: number
          quantity_destination?: number
          difference?: number
          difference_type?: 'falta' | 'sobra' | 'avaria' | 'troca'
          created_at?: string
        }
      }
    }
  }
}
