import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for server operations

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function uploadImageToSupabase(file: File, fileName: string): Promise<string> {
  try {
    // Convert File to ArrayBuffer for server-side upload
    const arrayBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('pallet-images')
      .upload(fileName, arrayBuffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      throw error
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('pallet-images')
      .getPublicUrl(fileName)

    console.log(`✅ Image uploaded to Supabase: ${publicUrlData.publicUrl}`)
    return publicUrlData.publicUrl

  } catch (error) {
    console.error('Error uploading to Supabase:', error)
    throw error
  }
}

export async function uploadBase64ToSupabase(base64Data: string, fileName: string, mimeType: string = 'image/jpeg'): Promise<string> {
  try {
    // Remove data URL prefix if present
    const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '')
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64String, 'base64')

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('pallet-images')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      throw error
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('pallet-images')
      .getPublicUrl(fileName)

    console.log(`✅ Base64 image uploaded to Supabase: ${publicUrlData.publicUrl}`)
    return publicUrlData.publicUrl

  } catch (error) {
    console.error('Error uploading base64 to Supabase:', error)
    throw error
  }
}
