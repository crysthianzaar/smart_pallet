import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, requireAnyRole } from '../../../lib/auth';
import { repositoryFactory } from '../../../server/adapters/firebase/repository-factory';
import { GetKpisUC } from '../../../server/use_cases/dashboard-use-cases';

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const contractId = searchParams.get('contractId') || undefined;
    
    const getKpisUC = new GetKpisUC(repositoryFactory);
    const kpis = await getKpisUC.execute(startDate, endDate, contractId);
    
    return createApiResponse(kpis);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get KPIs';
    return createErrorResponse(message, 400);
  }
}, requireAnyRole);
