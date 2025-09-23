import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, MVP_USER_ID } from '../../../lib/api-utils';
import { RepositoryFactory } from '../../../lib/repositories';
import { ManifestCreateSchema } from '../../../lib/models';

const manifestRepository = RepositoryFactory.getManifestRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ManifestCreateSchema.parse(body);
    
    const manifestData = {
      ...validatedData,
      created_by: MVP_USER_ID,
    };
    
    const manifest = await manifestRepository.create(manifestData);
    
    return createApiResponse(manifest, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create manifest';
    return createErrorResponse(message, 400);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const contractId = searchParams.get('contractId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let manifests;
    if (status) {
      manifests = await manifestRepository.findByStatus(status);
    } else if (contractId) {
      manifests = await manifestRepository.findByContract(contractId);
    } else {
      manifests = await manifestRepository.findAll(limit, offset);
    }
    
    return createApiResponse(manifests);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list manifests';
    return createErrorResponse(message, 400);
  }
}
