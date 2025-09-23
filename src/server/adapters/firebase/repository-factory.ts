import { IRepositoryFactory } from '../../repo/interfaces';
import {
  FirebaseUserRepository,
  FirebaseContractRepository,
  FirebaseLocationRepository,
  FirebaseSkuRepository,
  FirebasePalletRepository,
  FirebasePalletItemRepository,
  FirebaseManifestRepository,
  FirebaseManifestPalletRepository,
  FirebaseReceiptRepository,
  FirebaseComparisonRepository,
  FirebaseAuditLogRepository,
} from './repositories';
import { FirebaseFileRepository } from './file-repository';

export class FirebaseRepositoryFactory implements IRepositoryFactory {
  private userRepository?: FirebaseUserRepository;
  private contractRepository?: FirebaseContractRepository;
  private locationRepository?: FirebaseLocationRepository;
  private skuRepository?: FirebaseSkuRepository;
  private palletRepository?: FirebasePalletRepository;
  private palletItemRepository?: FirebasePalletItemRepository;
  private manifestRepository?: FirebaseManifestRepository;
  private manifestPalletRepository?: FirebaseManifestPalletRepository;
  private receiptRepository?: FirebaseReceiptRepository;
  private comparisonRepository?: FirebaseComparisonRepository;
  private auditLogRepository?: FirebaseAuditLogRepository;
  private fileRepository?: FirebaseFileRepository;

  getUserRepository() {
    if (!this.userRepository) {
      this.userRepository = new FirebaseUserRepository();
    }
    return this.userRepository;
  }

  getContractRepository() {
    if (!this.contractRepository) {
      this.contractRepository = new FirebaseContractRepository();
    }
    return this.contractRepository;
  }

  getLocationRepository() {
    if (!this.locationRepository) {
      this.locationRepository = new FirebaseLocationRepository();
    }
    return this.locationRepository;
  }

  getSkuRepository() {
    if (!this.skuRepository) {
      this.skuRepository = new FirebaseSkuRepository();
    }
    return this.skuRepository;
  }

  getPalletRepository() {
    if (!this.palletRepository) {
      this.palletRepository = new FirebasePalletRepository();
    }
    return this.palletRepository;
  }

  getPalletItemRepository() {
    if (!this.palletItemRepository) {
      this.palletItemRepository = new FirebasePalletItemRepository();
    }
    return this.palletItemRepository;
  }

  getManifestRepository() {
    if (!this.manifestRepository) {
      this.manifestRepository = new FirebaseManifestRepository();
    }
    return this.manifestRepository;
  }

  getManifestPalletRepository() {
    if (!this.manifestPalletRepository) {
      this.manifestPalletRepository = new FirebaseManifestPalletRepository();
    }
    return this.manifestPalletRepository;
  }

  getReceiptRepository() {
    if (!this.receiptRepository) {
      this.receiptRepository = new FirebaseReceiptRepository();
    }
    return this.receiptRepository;
  }

  getComparisonRepository() {
    if (!this.comparisonRepository) {
      this.comparisonRepository = new FirebaseComparisonRepository();
    }
    return this.comparisonRepository;
  }

  getAuditLogRepository() {
    if (!this.auditLogRepository) {
      this.auditLogRepository = new FirebaseAuditLogRepository();
    }
    return this.auditLogRepository;
  }

  getFileRepository() {
    if (!this.fileRepository) {
      this.fileRepository = new FirebaseFileRepository();
    }
    return this.fileRepository;
  }
}

// Singleton instance
export const repositoryFactory = new FirebaseRepositoryFactory();
