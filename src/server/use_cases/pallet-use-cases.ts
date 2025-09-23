import { IRepositoryFactory } from '../repo/interfaces';
import { PalletCreate, CountReview } from '../models';
import {
  CreatePalletTask,
  AttachPhotosTask,
  SuggestCountTask,
  EnforceManualReviewTask,
  SealPalletTask,
} from '../tasks/pallet-tasks';

export class CreatePalletUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(data: PalletCreate, userId: string) {
    const task = new CreatePalletTask(this.repositoryFactory);
    return await task.execute(data, userId);
  }
}

export class CapturePhotosUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(palletId: string, photoUrls: string[], userId: string) {
    const task = new AttachPhotosTask(this.repositoryFactory);
    return await task.execute(palletId, photoUrls, userId);
  }
}

export class InferAndReviewUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(palletId: string) {
    // Run AI suggestion
    const suggestTask = new SuggestCountTask(this.repositoryFactory);
    const { confGlobal, items } = await suggestTask.execute(palletId);

    // Enforce manual review if needed
    const reviewTask = new EnforceManualReviewTask(this.repositoryFactory);
    const requiresManualReview = await reviewTask.execute(palletId, confGlobal);

    return {
      confGlobal,
      items,
      requiresManualReview,
    };
  }
}

export class SealPalletUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(palletId: string, userId: string, countReview?: CountReview) {
    const task = new SealPalletTask(this.repositoryFactory);
    return await task.execute(palletId, userId, countReview);
  }
}

export class GetPalletUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(palletId: string) {
    const palletRepo = this.repositoryFactory.getPalletRepository();
    const palletItemRepo = this.repositoryFactory.getPalletItemRepository();
    const contractRepo = this.repositoryFactory.getContractRepository();
    const locationRepo = this.repositoryFactory.getLocationRepository();
    const skuRepo = this.repositoryFactory.getSkuRepository();

    const pallet = await palletRepo.findById(palletId);
    if (!pallet) {
      throw new Error('Pallet not found');
    }

    const items = await palletItemRepo.findByPallet(palletId);
    const contract = await contractRepo.findById(pallet.contractOriginId);
    const location = await locationRepo.findById(pallet.locationOriginId);

    // Enrich items with SKU information
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const sku = await skuRepo.findById(item.skuId);
        return {
          ...item,
          sku,
        };
      })
    );

    return {
      pallet,
      items: enrichedItems,
      contract,
      location,
    };
  }
}

export class ListPalletsUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(
    filters: {
      status?: string;
      contractId?: string;
      locationId?: string;
      requiresManualReview?: boolean;
    } = {},
    limit: number = 50,
    startAfter?: string
  ) {
    const palletRepo = this.repositoryFactory.getPalletRepository();

    let pallets = [];

    if (filters.status) {
      pallets = await palletRepo.findByStatus(filters.status);
    } else if (filters.contractId) {
      pallets = await palletRepo.findByContract(filters.contractId);
    } else if (filters.locationId) {
      pallets = await palletRepo.findByLocation(filters.locationId);
    } else if (filters.requiresManualReview) {
      pallets = await palletRepo.findRequiringManualReview();
    } else {
      pallets = await palletRepo.list(limit, startAfter);
    }

    return pallets.slice(0, limit);
  }
}

export class AddItemToPalletUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(palletId: string, skuId: string, userId: string) {
    const palletRepo = this.repositoryFactory.getPalletRepository();
    const palletItemRepo = this.repositoryFactory.getPalletItemRepository();
    const skuRepo = this.repositoryFactory.getSkuRepository();

    // Validate pallet exists and is in draft status
    const pallet = await palletRepo.findById(palletId);
    if (!pallet) {
      throw new Error('Pallet not found');
    }

    if (pallet.status !== 'rascunho') {
      throw new Error('Cannot add items to sealed pallet');
    }

    // Validate SKU exists
    const sku = await skuRepo.findById(skuId);
    if (!sku) {
      throw new Error('SKU not found');
    }

    // Check if SKU is already in pallet
    const existingItems = await palletItemRepo.findByPallet(palletId);
    const skuExists = existingItems.some(item => item.skuId === skuId);
    if (skuExists) {
      throw new Error('SKU is already in this pallet');
    }

    // Check SKU limit (max 2 SKUs per pallet)
    if (existingItems.length >= 2) {
      throw new Error('Pallet cannot have more than 2 SKUs');
    }

    // Create pallet item
    const palletItem = await palletItemRepo.create({
      palletId,
      skuId,
    });

    return palletItem;
  }
}
