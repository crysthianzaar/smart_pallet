import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, MVP_USER_ID } from '../../../lib/api-utils';
import { RepositoryFactory } from '../../../lib/repositories';
import { ReceiptCreateSchema } from '../../../lib/models';

const receiptRepository = RepositoryFactory.getReceiptRepository();
const manifestRepository = RepositoryFactory.getManifestRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creating receipt with data:', body);
    
    const validatedData = ReceiptCreateSchema.parse(body);
    
    // Validate that manifest_id is provided (required field)
    if (!validatedData.manifest_id) {
      return createErrorResponse('manifest_id is required', 400);
    }

    const receiptData = {
      ...validatedData,
      received_at: new Date().toISOString(),
    };
    
    console.log('Final receipt data:', receiptData);
    
    const receipt = await receiptRepository.create(receiptData);
    console.log('Receipt created:', receipt);
    
    // Update manifest status to 'entregue' (delivered) when receipt is created
    try {
      const manifestUpdated = await manifestRepository.markAsDelivered(validatedData.manifest_id);
      console.log('Manifest status updated to delivered:', manifestUpdated);
    } catch (manifestError) {
      console.error('Error updating manifest status:', manifestError);
      // Don't fail the receipt creation if manifest update fails
      // The receipt is still valid even if manifest status update fails
    }
    
    return createApiResponse(receipt, 201);
  } catch (error) {
    console.error('Error creating receipt:', error);
    const message = error instanceof Error ? error.message : 'Failed to create receipt';
    return createErrorResponse(message, 400);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let receipts;
    if (startDate && endDate) {
      receipts = await receiptRepository.findByDateRange(new Date(startDate), new Date(endDate));
    } else if (status && ['ok', 'alerta', 'critico'].includes(status)) {
      receipts = await receiptRepository.findByStatus(status as 'ok' | 'alerta' | 'critico');
    } else {
      receipts = await receiptRepository.findAllWithDetails(limit, offset);
    }
    
    return createApiResponse(receipts);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list receipts';
    return createErrorResponse(message, 400);
  }
}
