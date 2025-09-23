import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, requireAdmin } from '../../../../lib/auth';
import { repositoryFactory } from '../../../../server/adapters/firebase/repository-factory';
import { CreateSkuUC, ListSkusUC } from '../../../../server/use_cases/admin-use-cases';
import { SkuCreateSchema } from '../../../../server/models';

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const validatedData = SkuCreateSchema.parse(body);
    
    const createSkuUC = new CreateSkuUC(repositoryFactory);
    const sku = await createSkuUC.execute(validatedData, user.uid);
    
    return createApiResponse(sku, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create SKU';
    return createErrorResponse(message, 400);
  }
}, requireAdmin);

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const startAfter = searchParams.get('startAfter') || undefined;
    
    const listSkusUC = new ListSkusUC(repositoryFactory);
    const skus = await listSkusUC.execute(activeOnly, limit, startAfter);
    
    return createApiResponse(skus);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list SKUs';
    return createErrorResponse(message, 400);
  }
}, requireAdmin);
