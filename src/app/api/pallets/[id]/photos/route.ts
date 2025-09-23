import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, requireAnyRole } from '../../../../../lib/auth';
import { repositoryFactory } from '../../../../../server/adapters/firebase/repository-factory';
import { CapturePhotosUC } from '../../../../../server/use_cases/pallet-use-cases';
import { z } from 'zod';

const CapturePhotosSchema = z.object({
  photoUrls: z.array(z.string().url()),
});

export const POST = withAuth(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    const { photoUrls } = CapturePhotosSchema.parse(body);
    
    const capturePhotosUC = new CapturePhotosUC(repositoryFactory);
    const pallet = await capturePhotosUC.execute(params.id, photoUrls, user.uid);
    
    return createApiResponse(pallet);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to capture photos';
    return createErrorResponse(message, 400);
  }
}, requireAnyRole);
