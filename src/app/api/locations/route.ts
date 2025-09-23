import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../lib/api-utils';
import { RepositoryFactory } from '../../../lib/repositories';
import { LocationCreateSchema } from '../../../lib/models';

const locationRepository = RepositoryFactory.getLocationRepository();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'origem' | 'destino' | 'estoque' | null;
    const contractId = searchParams.get('contractId');
    const status = searchParams.get('status') as 'active' | 'inactive' | null;
    
    let locations;
    if (type === 'origem') {
      locations = await locationRepository.findOrigins();
    } else if (type === 'destino') {
      locations = await locationRepository.findDestinations();
    } else if (type) {
      locations = await locationRepository.findByType(type);
    } else if (contractId) {
      locations = await locationRepository.findByContract(contractId);
    } else if (status) {
      locations = await locationRepository.findByStatus(status);
    } else {
      locations = await locationRepository.findAll();
    }
    
    return createApiResponse(locations);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch locations';
    return createErrorResponse(message, 500);
  }
}

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
