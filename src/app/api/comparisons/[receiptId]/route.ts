import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';

const comparisonRepository = RepositoryFactory.getComparisonRepository();

export async function GET(request: NextRequest, { params }: { params: Promise<{ receiptId: string }> }) {
  try {
    const { receiptId } = await params;
    
    // Get comparisons for the receipt
    const comparisons = await comparisonRepository.findByReceipt(receiptId);
    
    return createApiResponse(comparisons);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get receipt comparisons';
    return createErrorResponse(message, 500);
  }
}