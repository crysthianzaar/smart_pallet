import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, requireAnyRole } from '../../../../../lib/auth';
import { repositoryFactory } from '../../../../../server/adapters/firebase/repository-factory';
import { AddPalletToManifestUC } from '../../../../../server/use_cases/manifest-use-cases';
import { z } from 'zod';

const AddPalletSchema = z.object({
  palletId: z.string(),
});

export const PATCH = withAuth(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    const { palletId } = AddPalletSchema.parse(body);
    
    const addPalletUC = new AddPalletToManifestUC(repositoryFactory);
    const manifestPallet = await addPalletUC.execute(params.id, palletId, user.uid);
    
    return createApiResponse(manifestPallet);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add pallet to manifest';
    return createErrorResponse(message, 400);
  }
}, requireAnyRole);
