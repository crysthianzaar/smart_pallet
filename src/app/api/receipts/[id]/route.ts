import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';

const receiptRepository = RepositoryFactory.getReceiptRepository();
const manifestRepository = RepositoryFactory.getManifestRepository();
const palletRepository = RepositoryFactory.getPalletRepository();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Get receipt details
    const receipt = await receiptRepository.findById(id);
    if (!receipt) {
      return createErrorResponse('Receipt not found', 404);
    }

    // Create display name
    const receiptWithDisplayName = {
      ...receipt,
      display_name: `RECEIPT-${receipt.manifest_id}` // Will be updated with manifest number below
    };

    // Get manifest details if manifest_id exists
    let manifest = null;
    let contract = null;
    let originLocation = null;
    let destinationLocation = null;

    if (receipt.manifest_id) {
      try {
        const manifestDetails = await manifestRepository.getWithDetails(receipt.manifest_id);
        if (manifestDetails) {
          manifest = manifestDetails.manifest;
          contract = manifestDetails.contract;
          originLocation = manifestDetails.originLocation;
          destinationLocation = manifestDetails.destinationLocation;
          
          // Update display name with manifest number
          receiptWithDisplayName.display_name = `RECEIPT-${manifest.manifest_number || receipt.manifest_id}`;
          (receiptWithDisplayName as Record<string, unknown>).manifest_number = manifest.manifest_number;
        }
      } catch (manifestError) {
        console.error('Error fetching manifest details:', manifestError);
        // Continue without manifest details
      }
    }

    // Get pallet details if pallet_id exists
    let pallet = null;
    if (receipt.pallet_id) {
      try {
        pallet = await palletRepository.findById(receipt.pallet_id);
      } catch (palletError) {
        console.error('Error fetching pallet details:', palletError);
        // Continue without pallet details
      }
    }

    const response = {
      receipt: receiptWithDisplayName,
      manifest,
      pallet,
      contract,
      originLocation,
      destinationLocation
    };

    return createApiResponse(response);
  } catch (error) {
    console.error('Error getting receipt details:', error);
    const message = error instanceof Error ? error.message : 'Failed to get receipt details';
    return createErrorResponse(message, 500);
  }
}
