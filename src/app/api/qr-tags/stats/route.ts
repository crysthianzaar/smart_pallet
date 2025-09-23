import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';

const qrTagRepository = RepositoryFactory.getQrTagRepository();

export async function GET(request: NextRequest) {
  try {
    const total = await qrTagRepository.count();
    const available = await qrTagRepository.getAvailableCount();
    const linked = await qrTagRepository.getLinkedCount();
    
    const stats = {
      total,
      available,
      linked,
      utilization: total > 0 ? Math.round((linked / total) * 100) : 0,
    };
    
    return createApiResponse(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch QR tag statistics';
    return createErrorResponse(message, 500);
  }
}
