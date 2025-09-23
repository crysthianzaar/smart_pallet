import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';
import { LocationUpdateSchema } from '../../../../lib/models';

const locationRepository = RepositoryFactory.getLocationRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const location = await locationRepository.findById(params.id);
    
    if (!location) {
      return createErrorResponse('Location not found', 404);
    }
    
    return createApiResponse(location);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch location';
    return createErrorResponse(message, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = LocationUpdateSchema.parse(body);
    
    const location = await locationRepository.update(params.id, validatedData);
    
    if (!location) {
      return createErrorResponse('Location not found', 404);
    }
    
    return createApiResponse(location);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update location';
    return createErrorResponse(message, 400);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await locationRepository.delete(params.id);
    
    if (!success) {
      return createErrorResponse('Location not found', 404);
    }
    
    return createApiResponse({ message: 'Location deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete location';
    return createErrorResponse(message, 500);
  }
}
