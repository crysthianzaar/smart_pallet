import { NextRequest } from 'next/server';
import { createErrorResponse } from '../../../../lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    // Database reset functionality not implemented for Supabase
    return createErrorResponse('Database reset not implemented for Supabase', 501);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reset database';
    return createErrorResponse(message, 500);
  }
}
