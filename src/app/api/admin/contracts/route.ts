import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';
import { ContractCreateSchema } from '../../../../lib/models';

const contractRepository = RepositoryFactory.getContractRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Garantir que o body tenha todos os campos necessários
    if (!body.company) {
      return createErrorResponse('Field "company" is required', 400);
    }
    
    const validatedData = ContractCreateSchema.parse(body);
    const contract = await contractRepository.create(validatedData);
    
    return createApiResponse(contract, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create contract';
    return createErrorResponse(message, 400);
  }
}

export async function GET(request: NextRequest) {
  try {
    const contracts = await contractRepository.findAll();
    
    return createApiResponse(contracts);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list contracts';
    return createErrorResponse(message, 400);
  }
}
