import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';

const palletRepository = RepositoryFactory.getPalletRepository();
const qrTagRepository = RepositoryFactory.getQrTagRepository();

export async function GET(request: NextRequest) {
  try {
    // Get pallet statistics
    const palletStats = await palletRepository.getStatistics();
    
    // Get QR tag statistics
    const qrTagStats = {
      total: await qrTagRepository.count(),
      available: await qrTagRepository.getAvailableCount(),
      linked: await qrTagRepository.getLinkedCount(),
    };
    
    // Calculate today's stats (mock data for now - would need date filtering)
    const todayStats = {
      manifestsCreated: 0,
      palletsReceived: 0,
      criticalDifferences: 0,
    };
    
    const dashboardStats = {
      pallets: {
        total: palletStats.total,
        inTransit: palletStats.byStatus['em_transporte'] || 0,
        sealed: palletStats.byStatus['selado'] || 0,
        received: palletStats.byStatus['recebido'] || 0,
        draft: palletStats.byStatus['rascunho'] || 0,
        requiresManualReview: palletStats.requiresManualReview,
        avgConfidence: palletStats.avgConfidence,
      },
      qrTags: {
        total: qrTagStats.total,
        available: qrTagStats.available,
        linked: qrTagStats.linked,
        utilization: qrTagStats.total > 0 ? Math.round((qrTagStats.linked / qrTagStats.total) * 100) : 0,
      },
      today: todayStats,
      trends: {
        palletsGrowth: '+12%', // Mock data
        confidenceImprovement: '+2.1%', // Mock data
        efficiencyRate: '87%', // Mock data
      }
    };
    
    return createApiResponse(dashboardStats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dashboard statistics';
    return createErrorResponse(message, 500);
  }
}
