import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, requireAnyRole } from '../../../../lib/auth';
import { repositoryFactory } from '../../../../server/adapters/firebase/repository-factory';
import { GetManifestUC } from '../../../../server/use_cases/manifest-use-cases';

export const GET = withAuth(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const getManifestUC = new GetManifestUC(repositoryFactory);
    const manifestData = await getManifestUC.execute(params.id);
    
    return createApiResponse(manifestData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get manifest';
    return createErrorResponse(message, 404);
  }
}, requireAnyRole);
