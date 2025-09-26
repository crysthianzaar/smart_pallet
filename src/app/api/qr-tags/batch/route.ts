import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';
import { z } from 'zod';

const qrTagRepository = RepositoryFactory.getQrTagRepository();

const BatchGenerateSchema = z.object({
  prefix: z.string().min(1).max(10).default('QR'),
  startNumber: z.number().int().min(1).default(1),
  count: z.number().int().min(1).max(1000)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prefix, startNumber, count } = BatchGenerateSchema.parse(body);
    
    // Generate QR codes
    const qrTags = [];
    const existingCodes = [];
    
    for (let i = 0; i < count; i++) {
      const number = startNumber + i;
      const qrCode = `${prefix}${number.toString().padStart(3, '0')}`;
      
      // Check if QR code already exists
      const existing = await qrTagRepository.findByQrCode(qrCode);
      if (existing) {
        existingCodes.push(qrCode);
        continue;
      }
      
      const qrTag = await qrTagRepository.create({
        qr_code: qrCode,
        status: 'livre'
      });
      
      qrTags.push(qrTag);
    }
    
    const result = {
      generated: qrTags,
      skipped: existingCodes,
      summary: {
        requested: count,
        generated: qrTags.length,
        skipped: existingCodes.length
      }
    };
    
    return createApiResponse(result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate QR tags batch';
    return createErrorResponse(message, 400);
  }
}
