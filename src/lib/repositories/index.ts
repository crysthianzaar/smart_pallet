// Repository exports
export { BaseRepository } from './base-repository';
export { ContractRepository } from './contract-repository';
export { LocationRepository } from './location-repository';
export { SkuRepository } from './sku-repository';
export { QrTagRepository } from './qr-tag-repository';
export { PalletRepository } from './pallet-repository';
export { ManifestRepository } from './manifest-repository';
export { ReceiptRepository } from './receipt-repository';
export { ComparisonRepository } from './comparison-repository';

// Import types for factory
import { ContractRepository } from './contract-repository';
import { LocationRepository } from './location-repository';
import { SkuRepository } from './sku-repository';
import { QrTagRepository } from './qr-tag-repository';
import { PalletRepository } from './pallet-repository';
import { ManifestRepository } from './manifest-repository';
import { ReceiptRepository } from './receipt-repository';
import { ComparisonRepository } from './comparison-repository';

// Repository factory
export class RepositoryFactory {
  private static contractRepository: ContractRepository;
  private static locationRepository: LocationRepository;
  private static skuRepository: SkuRepository;
  private static qrTagRepository: QrTagRepository;
  private static palletRepository: PalletRepository;
  private static manifestRepository: ManifestRepository;
  private static receiptRepository: ReceiptRepository;
  private static comparisonRepository: ComparisonRepository;

  static getContractRepository(): ContractRepository {
    if (!this.contractRepository) {
      this.contractRepository = new ContractRepository();
    }
    return this.contractRepository;
  }

  static getLocationRepository(): LocationRepository {
    if (!this.locationRepository) {
      this.locationRepository = new LocationRepository();
    }
    return this.locationRepository;
  }

  static getSkuRepository(): SkuRepository {
    if (!this.skuRepository) {
      this.skuRepository = new SkuRepository();
    }
    return this.skuRepository;
  }

  static getQrTagRepository(): QrTagRepository {
    if (!this.qrTagRepository) {
      this.qrTagRepository = new QrTagRepository();
    }
    return this.qrTagRepository;
  }

  static getPalletRepository(): PalletRepository {
    if (!this.palletRepository) {
      this.palletRepository = new PalletRepository();
    }
    return this.palletRepository;
  }

  static getManifestRepository(): ManifestRepository {
    if (!this.manifestRepository) {
      this.manifestRepository = new ManifestRepository();
    }
    return this.manifestRepository;
  }

  static getReceiptRepository(): ReceiptRepository {
    if (!this.receiptRepository) {
      this.receiptRepository = new ReceiptRepository();
    }
    return this.receiptRepository;
  }

  static getComparisonRepository(): ComparisonRepository {
    if (!this.comparisonRepository) {
      this.comparisonRepository = new ComparisonRepository();
    }
    return this.comparisonRepository;
  }
}
