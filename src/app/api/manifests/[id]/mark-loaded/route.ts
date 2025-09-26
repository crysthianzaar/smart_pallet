import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../../lib/repositories';

const manifestRepository = RepositoryFactory.getManifestRepository();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const success = await manifestRepository.markAsLoaded(id);
    
    return createApiResponse({ success });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark manifest as loaded';
    return createErrorResponse(message, 400);
  }
}
