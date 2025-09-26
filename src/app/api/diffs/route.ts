import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../lib/api-utils';
import { RepositoryFactory } from '../../../lib/repositories';

const comparisonRepository = RepositoryFactory.getComparisonRepository();

export async function GET(request: NextRequest) {
  try {
    // Return empty array for now - comparisons functionality not fully implemented
    const differences: unknown[] = [];
    
    return createApiResponse(differences);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list differences';
    return createErrorResponse(message, 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    // CSV export functionality not implemented yet
    return createErrorResponse('CSV export not implemented yet', 501);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export differences CSV';
    return createErrorResponse(message, 400);
  }
}
