import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { seedDatabase } from '../../../../lib/seed-data';

export async function POST(request: NextRequest) {
  try {
    const result = await seedDatabase();
    
    return createApiResponse({
      message: 'Database seeded successfully',
      data: result
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to seed database';
    return createErrorResponse(message, 500);
  }
}
