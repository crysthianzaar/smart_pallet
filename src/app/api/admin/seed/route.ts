import { NextRequest } from 'next/server';
import { createErrorResponse } from '../../../../lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    // Database seeding functionality not implemented for Supabase
    return createErrorResponse('Database seeding not implemented for Supabase', 501);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to seed database';
    return createErrorResponse(message, 500);
  }
}
