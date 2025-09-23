import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, requireAnyRole } from '../../../../../lib/auth';
import { repositoryFactory } from '../../../../../server/adapters/firebase/repository-factory';
import { SealPalletUC } from '../../../../../server/use_cases/pallet-use-cases';
import { CountReviewSchema } from '../../../../../server/models';

export const POST = withAuth(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    const countReview = body ? CountReviewSchema.parse(body) : undefined;
    
    const sealPalletUC = new SealPalletUC(repositoryFactory);
    const pallet = await sealPalletUC.execute(params.id, user.uid, countReview);
    
    return createApiResponse(pallet);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to seal pallet';
    return createErrorResponse(message, 400);
  }
}, requireAnyRole);
