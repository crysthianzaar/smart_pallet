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
    const palletId = searchParams.get('palletId');
    const skuId = searchParams.get('skuId');
    const differenceType = searchParams.get('differenceType');
    const critical = searchParams.get('critical') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let comparisons;
    if (critical) {
      comparisons = await comparisonRepository.findCriticalDifferences();
    } else if (startDate && endDate) {
      comparisons = await comparisonRepository.findByDateRange(new Date(startDate), new Date(endDate));
    } else if (receiptId) {
      comparisons = await comparisonRepository.findByReceipt(receiptId);
    } else if (palletId) {
      comparisons = await comparisonRepository.findByPallet(palletId);
    } else if (skuId) {
      comparisons = await comparisonRepository.findBySku(skuId);
    } else if (differenceType) {
      comparisons = await comparisonRepository.findByDifferenceType(differenceType);
    } else {
      comparisons = await comparisonRepository.findAll(limit, offset);
    }
    
    return createApiResponse(comparisons);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list comparisons';
    return createErrorResponse(message, 400);
  }
}
