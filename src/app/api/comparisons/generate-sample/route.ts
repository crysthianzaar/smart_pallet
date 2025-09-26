import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    // Sample comparison generation not implemented for Supabase
    return createErrorResponse('Sample comparison generation not implemented', 501);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate sample comparisons';
    return createErrorResponse(message, 500);
  }
}
