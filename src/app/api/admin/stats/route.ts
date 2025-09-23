import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';

export async function GET(request: NextRequest) {
  try {
    const contractRepo = RepositoryFactory.getContractRepository();
    const locationRepo = RepositoryFactory.getLocationRepository();
    const skuRepo = RepositoryFactory.getSkuRepository();
    const qrTagRepo = RepositoryFactory.getQrTagRepository();
    const palletRepo = RepositoryFactory.getPalletRepository();

    const [
      contractCount,
      locationCount,
      skuCount,
      qrTagCount,
      palletCount,
      qrTagStats
    ] = await Promise.all([
      contractRepo.count(),
      locationRepo.count(),
      skuRepo.count(),
      qrTagRepo.count(),
      palletRepo.count(),
      Promise.all([
        qrTagRepo.getAvailableCount(),
        qrTagRepo.getLinkedCount()
      ])
    ]);

    const [availableQrTags, linkedQrTags] = qrTagStats;

    const stats = {
      contracts: contractCount,
      locations: locationCount,
      skus: skuCount,
      qrTags: {
        total: qrTagCount,
        available: availableQrTags,
        linked: linkedQrTags,
        utilization: qrTagCount > 0 ? Math.round((linkedQrTags / qrTagCount) * 100) : 0
      },
      pallets: palletCount
    };

    return createApiResponse(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch admin statistics';
    return createErrorResponse(message, 500);
  }
}
