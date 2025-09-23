import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';
import { SkuUpdateSchema } from '../../../../lib/models';

const skuRepository = RepositoryFactory.getSkuRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sku = await skuRepository.findById(params.id);
    
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = SkuUpdateSchema.parse(body);
    
    const sku = await skuRepository.update(params.id, validatedData);
    
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
  { params }: { params: { id: string } }
) {
  try {
    const success = await skuRepository.delete(params.id);
    
    if (!success) {
      return createErrorResponse('SKU not found', 404);
    }
    
    return createApiResponse({ message: 'SKU deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete SKU';
    return createErrorResponse(message, 500);
  }
}
