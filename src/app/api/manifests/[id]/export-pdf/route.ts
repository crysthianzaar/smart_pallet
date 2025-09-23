import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, requireAnyRole } from '../../../../../lib/auth';
import { repositoryFactory } from '../../../../../server/adapters/firebase/repository-factory';
import { ExportManifestPdfUC } from '../../../../../server/use_cases/manifest-use-cases';

export const POST = withAuth(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  try {
    const exportPdfUC = new ExportManifestPdfUC(repositoryFactory);
    const pdfUrl = await exportPdfUC.execute(params.id, user.uid);
    
    return createApiResponse({ pdfUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export manifest PDF';
    return createErrorResponse(message, 400);
  }
}, requireAnyRole);
