import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../../lib/repositories';
import { z } from 'zod';

const AddPalletSchema = z.object({
  palletId: z.string(),
});

const manifestRepository = RepositoryFactory.getManifestRepository();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { palletId } = AddPalletSchema.parse(body);
    
    const success = await manifestRepository.addPallet(id, palletId);
    
    return createApiResponse({ success });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add pallet to manifest';
    return createErrorResponse(message, 400);
  }
}
