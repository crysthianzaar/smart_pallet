import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';

const manifestRepository = RepositoryFactory.getManifestRepository();

export async function GET(request: NextRequest) {
  try {
    const stats = await manifestRepository.getStatistics();
    
    return createApiResponse(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch manifest statistics';
    return createErrorResponse(message, 500);
  }
}
