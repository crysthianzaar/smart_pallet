import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, requireAnyRole } from '../../../lib/auth';
import { repositoryFactory } from '../../../server/adapters/firebase/repository-factory';
import { ListDiffsUC, ExportDiffsCsvUC } from '../../../server/use_cases/dashboard-use-cases';
import { ComparisonStatusSchema } from '../../../server/models';

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ? ComparisonStatusSchema.parse(searchParams.get('status')) : undefined;
    const contractId = searchParams.get('contractId') || undefined;
    const skuId = searchParams.get('skuId') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const startAfter = searchParams.get('startAfter') || undefined;
    
    const listDiffsUC = new ListDiffsUC(repositoryFactory);
    const differences = await listDiffsUC.execute(
      { status, contractId, skuId, startDate, endDate },
      limit,
      startAfter
    );
    
    return createApiResponse(differences);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list differences';
    return createErrorResponse(message, 400);
  }
}, requireAnyRole);

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { status, contractId, skuId, startDate, endDate } = body;
    
    const filters = {
      status: status ? ComparisonStatusSchema.parse(status) : undefined,
      contractId,
      skuId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    
    const exportDiffsCsvUC = new ExportDiffsCsvUC(repositoryFactory);
    const csvUrl = await exportDiffsCsvUC.execute(filters, user.uid);
    
    return createApiResponse({ csvUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export differences CSV';
    return createErrorResponse(message, 400);
  }
}, requireAnyRole);
