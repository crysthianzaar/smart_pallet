import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';

const manifestRepository = RepositoryFactory.getManifestRepository();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const manifestData = await manifestRepository.getWithDetails(params.id);
    
    if (!manifestData) {
      return createErrorResponse('Manifest not found', 404);
    }
    return createApiResponse(manifestData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get manifest';
    return createErrorResponse(message, 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { status } = body;
    
    if (!status) {
      return createErrorResponse('Status is required', 400);
    }

    const manifestId = params.id;
    let result = false;

    switch (status) {
      case 'carregado':
        result = await manifestRepository.markAsLoaded(manifestId);
        break;
      case 'em_transito':
        result = await manifestRepository.markAsInTransit(manifestId);
        break;
      case 'entregue':
        result = await manifestRepository.markAsDelivered(manifestId);
        break;
      default:
        return createErrorResponse('Invalid status', 400);
    }

    if (!result) {
      return createErrorResponse('Failed to update manifest status', 400);
    }

    return createApiResponse({ success: true, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update manifest status';
    return createErrorResponse(message, 500);
  }
}
