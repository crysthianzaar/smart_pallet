import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';
import { SkuCreateSchema } from '../../../../lib/models';

const skuRepository = RepositoryFactory.getSkuRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SkuCreateSchema.parse(body);
    
    const sku = await skuRepository.create(validatedData);
    
    return createApiResponse(sku, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create SKU';
    return createErrorResponse(message, 400);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let skus;
    if (activeOnly) {
      skus = await skuRepository.findActive();
    } else {
      skus = await skuRepository.findAll(limit, offset);
    }
    
    return createApiResponse(skus);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list SKUs';
    return createErrorResponse(message, 400);
  }
}
