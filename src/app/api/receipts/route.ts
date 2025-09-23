import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, MVP_USER_ID } from '../../../lib/api-utils';
import { RepositoryFactory } from '../../../lib/repositories';
import { ReceiptCreateSchema } from '../../../lib/models';

const receiptRepository = RepositoryFactory.getReceiptRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ReceiptCreateSchema.parse(body);
    
    const receiptData = {
      ...validatedData,
      received_by: MVP_USER_ID,
    };
    
    const receipt = await receiptRepository.create(receiptData);
    
    return createApiResponse(receipt, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create receipt';
    return createErrorResponse(message, 400);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let receipts;
    if (startDate && endDate) {
      receipts = await receiptRepository.findByDateRange(new Date(startDate), new Date(endDate));
    } else if (locationId) {
      receipts = await receiptRepository.findByLocation(locationId);
    } else if (status) {
      receipts = await receiptRepository.findByStatus(status);
    } else {
      receipts = await receiptRepository.findAll(limit, offset);
    }
    
    return createApiResponse(receipts);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list receipts';
    return createErrorResponse(message, 400);
  }
}
