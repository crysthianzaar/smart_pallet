import { IRepositoryFactory } from '../repo/interfaces';
import { ReceiptCreate } from '../models';
import {
  ReceivePalletTask,
  CompareOriginDestTask,
  UpdateComparisonTask,
} from '../tasks/receipt-tasks';

export class ReceiveAndCompareUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(
    receiptData: ReceiptCreate,
    destinationCounts: { skuId: string; qtd: number }[],
    userId: string
  ) {
    // First, receive the pallet
    const receiveTask = new ReceivePalletTask(this.repositoryFactory);
    const receipt = await receiveTask.execute(receiptData, userId);

    // Then, compare origin vs destination
    const compareTask = new CompareOriginDestTask(this.repositoryFactory);
    const comparisons = await compareTask.execute(receiptData.palletId, destinationCounts, userId);

    return {
      receipt,
      comparisons,
    };
  }
}

export class GetReceiptUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(palletId: string) {
    const receiptRepo = this.repositoryFactory.getReceiptRepository();
    const comparisonRepo = this.repositoryFactory.getComparisonRepository();
    const palletRepo = this.repositoryFactory.getPalletRepository();
    const locationRepo = this.repositoryFactory.getLocationRepository();

    const receipt = await receiptRepo.findByPallet(palletId);
    if (!receipt) {
      throw new Error('Receipt not found for this pallet');
    }

    const comparisons = await comparisonRepo.findByPallet(palletId);
    const pallet = await palletRepo.findById(palletId);
    const location = pallet ? await locationRepo.findById(receipt.destinationLocationId) : null;

    return {
      receipt,
      comparisons,
      pallet,
      location,
    };
  }
}

export class UpdateComparisonUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(comparisonId: string, motivo?: string, evidencias?: string[]) {
    const task = new UpdateComparisonTask(this.repositoryFactory);
    return await task.execute(comparisonId, motivo, evidencias);
  }
}

export class ListReceiptsUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(
    filters: {
      locationId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    limit: number = 50,
    startAfter?: string
  ) {
    const receiptRepo = this.repositoryFactory.getReceiptRepository();

    let receipts = [];

    if (filters.locationId) {
      receipts = await receiptRepo.findByLocation(filters.locationId);
    } else if (filters.startDate || filters.endDate) {
      receipts = await receiptRepo.findByDateRange(
        filters.startDate || new Date(0),
        filters.endDate || new Date()
      );
    } else {
      receipts = await receiptRepo.list(limit, startAfter);
    }

    return receipts.slice(0, limit);
  }
}

export class GetComparisonsByPalletUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(palletId: string) {
    const comparisonRepo = this.repositoryFactory.getComparisonRepository();
    const skuRepo = this.repositoryFactory.getSkuRepository();

    const comparisons = await comparisonRepo.findByPallet(palletId);

    // Enrich with SKU information
    const enrichedComparisons = await Promise.all(
      comparisons.map(async (comparison) => {
        const sku = await skuRepo.findById(comparison.skuId);
        return {
          ...comparison,
          sku,
        };
      })
    );

    return enrichedComparisons;
  }
}

export class ScanPalletQrUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(qrData: string) {
    const palletRepo = this.repositoryFactory.getPalletRepository();

    // Parse QR data (format: PALLET:{id};CONTRACT:{contractId})
    const qrMatch = qrData.match(/PALLET:([^;]+);CONTRACT:([^;]+)/);
    if (!qrMatch) {
      throw new Error('Invalid QR code format');
    }

    const [, palletId, contractId] = qrMatch;

    // Find pallet by QR
    const pallet = await palletRepo.findByQr(qrData);
    if (!pallet) {
      throw new Error('Pallet not found');
    }

    // Validate contract matches
    if (pallet.contractOriginId !== contractId) {
      throw new Error('Contract mismatch in QR code');
    }

    return pallet;
  }
}
