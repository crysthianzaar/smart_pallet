import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';
import { ContractUpdateSchema } from '../../../../lib/models';

const contractRepository = RepositoryFactory.getContractRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contract = await contractRepository.findById(params.id);
    
    if (!contract) {
      return createErrorResponse('Contract not found', 404);
    }
    
    return createApiResponse(contract);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch contract';
    return createErrorResponse(message, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = ContractUpdateSchema.parse(body);
    
    const contract = await contractRepository.update(params.id, validatedData);
    
    if (!contract) {
      return createErrorResponse('Contract not found', 404);
    }
    
    return createApiResponse(contract);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update contract';
    return createErrorResponse(message, 400);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await contractRepository.delete(params.id);
    
    if (!success) {
      return createErrorResponse('Contract not found', 404);
    }
    
    return createApiResponse({ message: 'Contract deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete contract';
    return createErrorResponse(message, 500);
  }
}
