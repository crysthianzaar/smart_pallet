import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../lib/api-utils';
import { RepositoryFactory } from '../../../lib/repositories';
import { ContractCreateSchema, ContractUpdateSchema } from '../../../lib/models';

const contractRepository = RepositoryFactory.getContractRepository();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'active' | 'inactive' | null;
    const company = searchParams.get('company');
    
    let contracts;
    if (status) {
      contracts = await contractRepository.findByStatus(status);
    } else if (company) {
      contracts = await contractRepository.findByCompany(company);
    } else {
      contracts = await contractRepository.findAll();
    }
    
    return createApiResponse(contracts);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch contracts';
    return createErrorResponse(message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ContractCreateSchema.parse(body);
    
    const contract = await contractRepository.create(validatedData);
    
    return createApiResponse(contract, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create contract';
    return createErrorResponse(message, 400);
  }
}
