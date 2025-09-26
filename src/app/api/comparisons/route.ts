import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../lib/api-utils';
import { RepositoryFactory } from '../../../lib/repositories';
import { ComparisonCreateSchema } from '../../../lib/models';

const comparisonRepository = RepositoryFactory.getComparisonRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ComparisonCreateSchema.parse(body);
    
    const comparison = await comparisonRepository.create(validatedData);
    
    return createApiResponse(comparison, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create comparison';
    return createErrorResponse(message, 400);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const receiptId = searchParams.get('receiptId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let comparisons;
    
    if (receiptId) {
      comparisons = await comparisonRepository.findByReceipt(receiptId);
    } else {
      comparisons = await comparisonRepository.findAll(limit, offset);
    }
    
    return createApiResponse(comparisons);
  } catch (error) {
    console.error('Error in GET /api/comparisons:', error);
    const message = error instanceof Error ? error.message : 'Failed to list comparisons';
    return createErrorResponse(message, 500);
  }
}
