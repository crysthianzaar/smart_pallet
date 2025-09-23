import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';

const comparisonRepository = RepositoryFactory.getComparisonRepository();

export async function GET(request: NextRequest) {
  try {
    const stats = await comparisonRepository.getStatistics();
    
    return createApiResponse(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch comparison statistics';
    return createErrorResponse(message, 500);
  }
}
