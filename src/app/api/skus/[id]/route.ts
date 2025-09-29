import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';
import { SkuUpdateSchema } from '../../../../lib/models';

const skuRepository = RepositoryFactory.getSkuRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sku = await skuRepository.findById(id);
    
    if (!sku) {
      return createErrorResponse('SKU not found', 404);
    }
    
    return createApiResponse(sku);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch SKU';
    return createErrorResponse(message, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = SkuUpdateSchema.parse(body);
    
    const sku = await skuRepository.update(id, validatedData);
    
    if (!sku) {
      return createErrorResponse('SKU not found', 404);
    }
    
    return createApiResponse(sku);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update SKU';
    return createErrorResponse(message, 400);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await skuRepository.delete(id);
    
    if (!success) {
      return createErrorResponse('SKU not found', 404);
    }
    
    return createApiResponse({ message: 'SKU deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete SKU';
    
    // Check if it's a foreign key constraint error and provide a more user-friendly message
    if (message.includes('Cannot delete SKU: it is currently being used in pallet items')) {
      return createErrorResponse('Cannot delete SKU: it is currently being used in pallet items. Remove it from all pallets first.', 400);
    }
    
    return createErrorResponse(message, 500);
  }
}
