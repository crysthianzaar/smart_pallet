import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, requireAnyRole } from '../../../../../lib/auth';
import { repositoryFactory } from '../../../../../server/adapters/firebase/repository-factory';
import { MarkLoadedUC } from '../../../../../server/use_cases/manifest-use-cases';

export const PATCH = withAuth(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const markLoadedUC = new MarkLoadedUC(repositoryFactory);
    const manifest = await markLoadedUC.execute(params.id, user.uid);
    
    return createApiResponse(manifest);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark manifest as loaded';
    return createErrorResponse(message, 400);
  }
}, requireAnyRole);
