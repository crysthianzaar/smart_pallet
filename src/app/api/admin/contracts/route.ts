import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, requireAdmin } from '../../../../lib/auth';
import { repositoryFactory } from '../../../../server/adapters/firebase/repository-factory';
import { CreateContractUC, ListContractsUC } from '../../../../server/use_cases/admin-use-cases';
import { ContractCreateSchema } from '../../../../server/models';

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const validatedData = ContractCreateSchema.parse(body);
    
    const createContractUC = new CreateContractUC(repositoryFactory);
    const contract = await createContractUC.execute(validatedData, user.uid);
    
    return createApiResponse(contract, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create contract';
    return createErrorResponse(message, 400);
  }
}, requireAdmin);

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const startAfter = searchParams.get('startAfter') || undefined;
    
    const listContractsUC = new ListContractsUC(repositoryFactory);
    const contracts = await listContractsUC.execute(activeOnly, limit, startAfter);
    
    return createApiResponse(contracts);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list contracts';
    return createErrorResponse(message, 400);
  }
}, requireAdmin);
