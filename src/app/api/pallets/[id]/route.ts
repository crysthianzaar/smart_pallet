import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';
import { PalletUpdateSchema } from '../../../../lib/models';

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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    console.log('Update pallet request:', { id: params.id, body });
    
    // Validate input data
    const validatedData = PalletUpdateSchema.parse(body);
    
    // Check if pallet exists
    const existingPallet = await palletRepository.findById(params.id);
    if (!existingPallet) {
      return createErrorResponse('Pallet not found', 404);
    }
    
    // Check if pallet can be updated (only active pallets)
    if (existingPallet.status !== 'ativo') {
      return createErrorResponse('Only active pallets can be updated', 400);
    }
    
    // Update the pallet
    const updatedPallet = await palletRepository.update(params.id, validatedData);
    
    if (!updatedPallet) {
      return createErrorResponse('Failed to update pallet', 500);
    }
    
    return createApiResponse(updatedPallet);
  } catch (error) {
    console.error('Error updating pallet:', error);
    const message = error instanceof Error ? error.message : 'Failed to update pallet';
    return createErrorResponse(message, 400);
  }
}
