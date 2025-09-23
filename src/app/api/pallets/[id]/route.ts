import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, requireAnyRole } from '../../../../lib/auth';
import { repositoryFactory } from '../../../../server/adapters/firebase/repository-factory';
import { GetPalletUC } from '../../../../server/use_cases/pallet-use-cases';

export const GET = withAuth(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const getPalletUC = new GetPalletUC(repositoryFactory);
    const palletData = await getPalletUC.execute(params.id);
    
    return createApiResponse(palletData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get pallet';
    return createErrorResponse(message, 404);
  }
}, requireAnyRole);
