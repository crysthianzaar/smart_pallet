import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, requireAnyRole } from '../../../../../lib/auth';
import { repositoryFactory } from '../../../../../server/adapters/firebase/repository-factory';
import { InferAndReviewUC } from '../../../../../server/use_cases/pallet-use-cases';

export const POST = withAuth(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const inferAndReviewUC = new InferAndReviewUC(repositoryFactory);
    const result = await inferAndReviewUC.execute(params.id);
    
    return createApiResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to infer counts';
    return createErrorResponse(message, 400);
  }
}, requireAnyRole);
