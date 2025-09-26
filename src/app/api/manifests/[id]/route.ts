import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';
import { ManifestUpdateSchema } from '../../../../lib/models';

const manifestRepository = RepositoryFactory.getManifestRepository();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const manifestData = await manifestRepository.getWithDetails(id);
    
    if (!manifestData) {
      return createErrorResponse('Manifest not found', 404);
    }
    return createApiResponse(manifestData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get manifest';
    return createErrorResponse(message, 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log('Update manifest request:', { id, body });
    
    // Check if this is a status-only update (legacy support)
    if (body.status && Object.keys(body).length === 1) {
      const { status } = body;
      const manifestId = id;
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
    }
    
    // Full manifest update
    const validatedData = ManifestUpdateSchema.parse(body);
    
    // Check if manifest exists
    const existingManifest = await manifestRepository.findById(id);
    if (!existingManifest) {
      return createErrorResponse('Manifest not found', 404);
    }
    
    // Check if manifest can be updated (only draft manifests)
    if (existingManifest.status !== 'rascunho') {
      return createErrorResponse('Only draft manifests can be updated', 400);
    }
    
    // Update the manifest
    const updatedManifest = await manifestRepository.update(id, validatedData);
    
    if (!updatedManifest) {
      return createErrorResponse('Failed to update manifest', 500);
    }
    
    return createApiResponse(updatedManifest);
  } catch (error) {
    console.error('Error updating manifest:', error);
    const message = error instanceof Error ? error.message : 'Failed to update manifest';
    return createErrorResponse(message, 400);
  }
}
