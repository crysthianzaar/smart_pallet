import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../lib/api-utils';
import { RepositoryFactory } from '../../../lib/repositories';
import { SkuCreateSchema } from '../../../lib/models';

const skuRepository = RepositoryFactory.getSkuRepository();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status') as 'active' | 'inactive' | null;
    
    let skus;
    if (search) {
      skus = await skuRepository.search(search);
    } else if (category) {
      skus = await skuRepository.findByCategory(category);
    } else if (status) {
      skus = await skuRepository.findByStatus(status);
    } else {
      skus = await skuRepository.findActive();
    }
    
    return createApiResponse(skus);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch SKUs';
    return createErrorResponse(message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SkuCreateSchema.parse(body);
    
    // Check if code already exists
    const existing = await skuRepository.findByCode(validatedData.code);
    if (existing) {
      return createErrorResponse('SKU code already exists', 409);
    }
    
    const sku = await skuRepository.create(validatedData);
    
    return createApiResponse(sku, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create SKU';
    return createErrorResponse(message, 400);
  }
}
