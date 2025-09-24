import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, requireAdmin } from '../../../../lib/auth';
import { RepositoryFactory } from '../../../../lib/repositories';
import { ContractCreateSchema } from '../../../../lib/models';

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    
    // Garantir que o body tenha todos os campos necessários
    if (!body.company) {
      return createErrorResponse('Field "company" is required', 400);
    }
    
    const validatedData = ContractCreateSchema.parse(body);
    
    const contractRepository = RepositoryFactory.getContractRepository();
    const contract = await contractRepository.create(validatedData);
    
    return createApiResponse(contract, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create contract';
    return createErrorResponse(message, 400);
  }
}, requireAdmin);

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const contractRepository = RepositoryFactory.getContractRepository();
    const contracts = await contractRepository.findAll();
    
    return createApiResponse(contracts);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list contracts';
    return createErrorResponse(message, 400);
  }
}, requireAdmin);
