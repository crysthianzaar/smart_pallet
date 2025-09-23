import { IRepositoryFactory } from '../repo/interfaces';
import { ManifestCreate } from '../models';
import {
  CreateManifestTask,
  AddPalletToManifestTask,
  MarkManifestLoadedTask,
  ExportManifestPdfTask,
} from '../tasks/manifest-tasks';

export class CreateManifestUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(data: ManifestCreate, userId: string) {
    const task = new CreateManifestTask(this.repositoryFactory);
    return await task.execute(data, userId);
  }
}

export class AddPalletToManifestUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(manifestId: string, palletId: string, userId: string) {
    const task = new AddPalletToManifestTask(this.repositoryFactory);
    return await task.execute(manifestId, palletId, userId);
  }
}

export class MarkLoadedUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(manifestId: string, userId: string) {
    const task = new MarkManifestLoadedTask(this.repositoryFactory);
    return await task.execute(manifestId, userId);
  }
}

export class ExportManifestPdfUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(manifestId: string, userId: string) {
    const task = new ExportManifestPdfTask(this.repositoryFactory);
    return await task.execute(manifestId, userId);
  }
}

export class GetManifestUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(manifestId: string) {
    const manifestRepo = this.repositoryFactory.getManifestRepository();
    const manifestPalletRepo = this.repositoryFactory.getManifestPalletRepository();
    const palletRepo = this.repositoryFactory.getPalletRepository();
    const contractRepo = this.repositoryFactory.getContractRepository();
    const locationRepo = this.repositoryFactory.getLocationRepository();

    const manifest = await manifestRepo.findById(manifestId);
    if (!manifest) {
      throw new Error('Manifest not found');
    }

    const manifestPallets = await manifestPalletRepo.findByManifest(manifestId);
    const contract = await contractRepo.findById(manifest.contractId);
    const originLocation = await locationRepo.findById(manifest.originLocationId);
    const destinationLocation = await locationRepo.findById(manifest.destinationLocationId);

    // Get pallet details
    const pallets = await Promise.all(
      manifestPallets.map(async (mp) => {
        const pallet = await palletRepo.findById(mp.palletId);
        return {
          manifestPallet: mp,
          pallet,
        };
      })
    );

    return {
      manifest,
      pallets,
      contract,
      originLocation,
      destinationLocation,
    };
  }
}

export class ListManifestsUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(
    filters: {
      status?: string;
      contractId?: string;
    } = {},
    limit: number = 50,
    startAfter?: string
  ) {
    const manifestRepo = this.repositoryFactory.getManifestRepository();

    let manifests = [];

    if (filters.status) {
      manifests = await manifestRepo.findByStatus(filters.status);
    } else if (filters.contractId) {
      manifests = await manifestRepo.findByContract(filters.contractId);
    } else {
      manifests = await manifestRepo.list(limit, startAfter);
    }

    return manifests.slice(0, limit);
  }
}

export class RemovePalletFromManifestUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(manifestId: string, palletId: string, userId: string) {
    const manifestRepo = this.repositoryFactory.getManifestRepository();
    const manifestPalletRepo = this.repositoryFactory.getManifestPalletRepository();

    // Validate manifest exists and is in draft status
    const manifest = await manifestRepo.findById(manifestId);
    if (!manifest) {
      throw new Error('Manifest not found');
    }

    if (manifest.status !== 'rascunho') {
      throw new Error('Cannot remove pallets from loaded manifest');
    }

    // Find and remove the manifest pallet relationship
    const manifestPallet = await manifestPalletRepo.findByPallet(palletId);
    if (!manifestPallet || manifestPallet.manifestId !== manifestId) {
      throw new Error('Pallet is not in this manifest');
    }

    await manifestPalletRepo.delete(manifestPallet.id);

    // Create audit log
    const auditRepo = this.repositoryFactory.getAuditLogRepository();
    await auditRepo.create({
      action: 'pallet_removed_from_manifest',
      entityType: 'manifest',
      entityId: manifestId,
      userId,
      details: { palletId },
      timestamp: new Date(),
    });

    return { success: true };
  }
}
