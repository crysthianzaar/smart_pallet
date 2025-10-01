import { NextRequest } from 'next/server'
import { uploadImageToSupabase } from '../../../lib/supabase-storage'
import { createApiResponse, createErrorResponse } from '../../../lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string

    if (!file) {
      return createErrorResponse('No file provided', 400)
    }

    if (!fileName) {
      return createErrorResponse('No fileName provided', 400)
    }

    // Upload to Supabase Storage
    const publicUrl = await uploadImageToSupabase(file, fileName)

    return createApiResponse({ publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    const message = error instanceof Error ? error.message : 'Failed to upload file'
    return createErrorResponse(message, 500)
  }
}
