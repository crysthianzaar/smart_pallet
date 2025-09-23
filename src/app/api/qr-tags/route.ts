import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../lib/api-utils';
import { RepositoryFactory } from '../../../lib/repositories';
import { QrTagCreateSchema } from '../../../lib/models';

const qrTagRepository = RepositoryFactory.getQrTagRepository();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'livre' | 'vinculado' | null;
    const qrCode = searchParams.get('qrCode');
    
    if (qrCode) {
      const qrTag = await qrTagRepository.findByQrCode(qrCode);
      return createApiResponse(qrTag);
    }
    
    let qrTags;
    if (status) {
      qrTags = await qrTagRepository.findByStatus(status);
    } else {
      qrTags = await qrTagRepository.findAll();
    }
    
    return createApiResponse(qrTags);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch QR tags';
    return createErrorResponse(message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Support bulk creation
    if (Array.isArray(body)) {
      const qrTags = [];
      for (const qrTagData of body) {
        const validatedData = QrTagCreateSchema.parse(qrTagData);
        
        // Check if QR code already exists
        const existing = await qrTagRepository.findByQrCode(validatedData.qr_code);
        if (existing) {
          return createErrorResponse(`QR code ${validatedData.qr_code} already exists`, 409);
        }
        
        const qrTag = await qrTagRepository.create(validatedData);
        qrTags.push(qrTag);
      }
      
      return createApiResponse(qrTags, 201);
    } else {
      const validatedData = QrTagCreateSchema.parse(body);
      
      // Check if QR code already exists
      const existing = await qrTagRepository.findByQrCode(validatedData.qr_code);
      if (existing) {
        return createErrorResponse('QR code already exists', 409);
      }
      
      const qrTag = await qrTagRepository.create(validatedData);
      
      return createApiResponse(qrTag, 201);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create QR tag';
    return createErrorResponse(message, 400);
  }
}
