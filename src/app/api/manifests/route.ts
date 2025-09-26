import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, MVP_USER_ID } from '../../../lib/api-utils';
import { RepositoryFactory } from '../../../lib/repositories';
import { ManifestCreateSchema } from '../../../lib/models';

const manifestRepository = RepositoryFactory.getManifestRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creating manifest with data:', body);
    
    // Extract pallet_ids from body before validation
    const { pallet_ids, ...manifestData } = body;
    
    const validatedData = ManifestCreateSchema.parse(manifestData);
    
    // Generate manifest number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const manifestNumber = `MAN-${day}${month}${year}${hours}${minutes}${seconds}`;
    
    const finalManifestData = {
      ...validatedData,
      manifest_number: manifestNumber,
      created_by: MVP_USER_ID,
    };
    
    console.log('Final manifest data:', finalManifestData);
    console.log('Manifest data keys:', Object.keys(finalManifestData));
    console.log('Manifest data values:', Object.values(finalManifestData));
    
    const manifest = await manifestRepository.create(finalManifestData);
    console.log('Created manifest:', manifest);
    
    // If pallet_ids are provided, add them to the manifest
    if (pallet_ids && Array.isArray(pallet_ids) && pallet_ids.length > 0) {
      console.log('Adding pallets to manifest:', pallet_ids);
      
      // Add each pallet to the manifest
      for (const palletId of pallet_ids) {
        try {
          await manifestRepository.addPallet(manifest.id, palletId);
        } catch (palletError) {
          console.error(`Error adding pallet ${palletId} to manifest:`, palletError);
          // Continue with other pallets even if one fails
        }
      }
    }
    
    return createApiResponse(manifest, 201);
  } catch (error) {
    console.error('Error creating manifest:', error);
    const message = error instanceof Error ? error.message : 'Failed to create manifest';
    return createErrorResponse(message, 400);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const contractId = searchParams.get('contractId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let manifests;
    if (status) {
      manifests = await manifestRepository.findByStatus(status);
    } else if (contractId) {
      manifests = await manifestRepository.findByContract(contractId);
    } else {
      manifests = await manifestRepository.findAll(limit, offset);
    }
    
    return createApiResponse(manifests);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list manifests';
    return createErrorResponse(message, 400);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const manifestId = searchParams.get('id');
    
    if (!manifestId) {
      return createErrorResponse('Manifest ID is required', 400);
    }
    
    // Check if manifest exists
    const manifest = await manifestRepository.findById(manifestId);
    if (!manifest) {
      return createErrorResponse('Manifest not found', 404);
    }
    
    // Check if manifest can be deleted (only draft manifests)
    if (manifest.status !== 'rascunho') {
      return createErrorResponse('Cannot delete manifest that is not in draft status', 400);
    }
    
    // Delete the manifest
    await manifestRepository.delete(manifestId);
    
    return createApiResponse({ message: 'Manifest deleted successfully' });
  } catch (error) {
    console.error('Error deleting manifest:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete manifest';
    return createErrorResponse(message, 500);
  }
}
