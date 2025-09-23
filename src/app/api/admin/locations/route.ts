import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, requireAdmin } from '../../../../lib/auth';
import { repositoryFactory } from '../../../../server/adapters/firebase/repository-factory';
import { CreateLocationUC, ListLocationsUC } from '../../../../server/use_cases/admin-use-cases';
import { LocationCreateSchema } from '../../../../server/models';

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const validatedData = LocationCreateSchema.parse(body);
    
    const createLocationUC = new CreateLocationUC(repositoryFactory);
    const location = await createLocationUC.execute(validatedData, user.uid);
    
    return createApiResponse(location, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create location';
    return createErrorResponse(message, 400);
  }
}, requireAdmin);

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const startAfter = searchParams.get('startAfter') || undefined;
    
    const listLocationsUC = new ListLocationsUC(repositoryFactory);
    const locations = await listLocationsUC.execute(activeOnly, limit, startAfter);
    
    return createApiResponse(locations);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list locations';
    return createErrorResponse(message, 400);
  }
}, requireAdmin);
