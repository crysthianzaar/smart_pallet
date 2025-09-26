import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';
import { LocationCreateSchema } from '../../../../lib/models';

const locationRepository = RepositoryFactory.getLocationRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = LocationCreateSchema.parse(body);
    
    const location = await locationRepository.create(validatedData);
    
    return createApiResponse(location, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create location';
    return createErrorResponse(message, 400);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let locations;
    if (activeOnly) {
      locations = await locationRepository.findByStatus('active');
    } else {
      locations = await locationRepository.findAll(limit, offset);
    }
    
    return createApiResponse(locations);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list locations';
    return createErrorResponse(message, 400);
  }
}
