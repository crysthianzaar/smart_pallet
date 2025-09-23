import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, requireAnyRole } from '../../../../../lib/auth';
import { repositoryFactory } from '../../../../../server/adapters/firebase/repository-factory';
import { AddItemToPalletUC } from '../../../../../server/use_cases/pallet-use-cases';
import { z } from 'zod';

const AddItemSchema = z.object({
  skuId: z.string(),
});

export const POST = withAuth(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    const { skuId } = AddItemSchema.parse(body);
    
    const addItemUC = new AddItemToPalletUC(repositoryFactory);
    const palletItem = await addItemUC.execute(params.id, skuId, user.uid);
    
    return createApiResponse(palletItem, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add item to pallet';
    return createErrorResponse(message, 400);
  }
}, requireAnyRole);
