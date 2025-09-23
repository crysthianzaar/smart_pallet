import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse, requireAnyRole } from '../../../lib/auth';
import { repositoryFactory } from '../../../server/adapters/firebase/repository-factory';
import { AuditTrailUC } from '../../../server/use_cases/dashboard-use-cases';

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') || undefined;
    const entityId = searchParams.get('entityId') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const startAfter = searchParams.get('startAfter') || undefined;
    
    const auditTrailUC = new AuditTrailUC(repositoryFactory);
    const auditLogs = await auditTrailUC.execute(
      { entityType, entityId, userId, action, startDate, endDate },
      limit,
      startAfter
    );
    
    return createApiResponse(auditLogs);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get audit trail';
    return createErrorResponse(message, 400);
  }
}, requireAnyRole);
