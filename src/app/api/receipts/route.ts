import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, MVP_USER_ID } from '../../../lib/api-utils';
import { RepositoryFactory } from '../../../lib/repositories';
import { ReceiptCreateSchema } from '../../../lib/models';

const receiptRepository = RepositoryFactory.getReceiptRepository();
const manifestRepository = RepositoryFactory.getManifestRepository();
const palletRepository = RepositoryFactory.getPalletRepository();
const qrTagRepository = RepositoryFactory.getQrTagRepository();

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

    // Finalize pallets and release QR tags automatically
    try {
      console.log('Processing pallets for receipt finalization...');
      
      // Get manifest details with pallets
      const manifestDetails = await manifestRepository.getWithDetails(validatedData.manifest_id);
      
      if (manifestDetails && manifestDetails.pallets && manifestDetails.pallets.length > 0) {
        console.log(`Processing ${manifestDetails.pallets.length} pallets for receipt finalization`);
        
        // Process each pallet individually to avoid failing all if one fails
        for (const pallet of manifestDetails.pallets) {
          try {
            // 1. Finalize pallet status
            await palletRepository.updateStatus(pallet.id, 'finalizado');
            console.log(`Pallet ${pallet.id} marked as finalized`);
            
            // 2. Release QR tag if it exists
            if (pallet.qr_tag_id) {
              await qrTagRepository.unlinkFromPallet(pallet.qr_tag_id);
              console.log(`QR tag ${pallet.qr_tag_id} released from pallet ${pallet.id}`);
            }
          } catch (palletError) {
            console.error(`Error processing pallet ${pallet.id}:`, palletError);
            // Continue processing other pallets even if one fails
          }
        }
        
        console.log('All pallets processed for receipt finalization');
      } else {
        console.log('No pallets found in manifest for finalization');
      }
    } catch (palletProcessingError) {
      console.error('Error during pallet finalization process:', palletProcessingError);
      // Don't fail the receipt creation if pallet processing fails
      // The receipt is still valid even if pallet finalization fails
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
