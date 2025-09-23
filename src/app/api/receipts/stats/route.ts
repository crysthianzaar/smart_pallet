import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';

const receiptRepository = RepositoryFactory.getReceiptRepository();

export async function GET(request: NextRequest) {
  try {
    const stats = await receiptRepository.getStatistics();
    
    return createApiResponse(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch receipt statistics';
    return createErrorResponse(message, 500);
  }
}
