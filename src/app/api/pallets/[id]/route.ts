import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';

const palletRepository = RepositoryFactory.getPalletRepository();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const palletData = await palletRepository.getWithDetails(params.id);
    
    if (!palletData) {
      return createErrorResponse('Pallet not found', 404);
    }
    
    return createApiResponse(palletData);
  } catch (error) {
    console.error('Error fetching pallet details:', error);
    const message = error instanceof Error ? error.message : 'Failed to get pallet';
    return createErrorResponse(message, 500);
  }
}
