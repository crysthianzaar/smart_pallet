import { BaseFirebaseRepository } from './base-repository';
import {
  User, Contract, Location, Sku, Pallet, PalletItem,
  Manifest, ManifestPallet, Receipt, Comparison, AuditLog, ComparisonStatus,
  UserCreate, ContractCreate, LocationCreate, SkuCreate, PalletCreate,
  PalletItemCreate, ManifestCreate, ReceiptCreate
} from '../../models';
import {
  IUserRepository, IContractRepository, ILocationRepository, ISkuRepository,
  IPalletRepository, IPalletItemRepository, IManifestRepository, IManifestPalletRepository,
  IReceiptRepository, IComparisonRepository, IAuditLogRepository
} from '../../repo/interfaces';

export class FirebaseUserRepository extends BaseFirebaseRepository<User, UserCreate> implements IUserRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOneByField('email', email);
  }

  async findByRole(role: string): Promise<User[]> {
    return this.findByField('role', role);
  }
}

export class FirebaseContractRepository extends BaseFirebaseRepository<Contract, ContractCreate> implements IContractRepository {
  constructor() {
    super('contracts');
  }

  async findByCode(code: string): Promise<Contract | null> {
    return this.findOneByField('code', code);
  }

  async findActive(): Promise<Contract[]> {
    return this.findByField('isActive', true);
  }
}

export class FirebaseLocationRepository extends BaseFirebaseRepository<Location, LocationCreate> implements ILocationRepository {
  constructor() {
    super('locations');
  }

  async findByCode(code: string): Promise<Location | null> {
    return this.findOneByField('code', code);
  }

  async findActive(): Promise<Location[]> {
    return this.findByField('isActive', true);
  }
}

export class FirebaseSkuRepository extends BaseFirebaseRepository<Sku, SkuCreate> implements ISkuRepository {
  constructor() {
    super('skus');
  }

  async findByCode(code: string): Promise<Sku | null> {
    return this.findOneByField('code', code);
  }

  async findActive(): Promise<Sku[]> {
    return this.findByField('isActive', true);
  }
}

export class FirebasePalletRepository extends BaseFirebaseRepository<Pallet, PalletCreate> implements IPalletRepository {
  constructor() {
    super('pallets');
  }

  async findByQr(qr: string): Promise<Pallet | null> {
    return this.findOneByField('qr', qr);
  }

  async findByStatus(status: string): Promise<Pallet[]> {
    return this.findByField('status', status);
  }

  async findByContract(contractId: string): Promise<Pallet[]> {
    return this.findByField('contractOriginId', contractId);
  }

  async findByLocation(locationId: string): Promise<Pallet[]> {
    return this.findByField('locationOriginId', locationId);
  }

  async findRequiringManualReview(): Promise<Pallet[]> {
    return this.findByField('requiresManualReview', true);
  }
}

export class FirebasePalletItemRepository extends BaseFirebaseRepository<PalletItem, PalletItemCreate> implements IPalletItemRepository {
  constructor() {
    super('palletItems');
  }

  async findByPallet(palletId: string): Promise<PalletItem[]> {
    return this.findByField('palletId', palletId);
  }

  async findBySku(skuId: string): Promise<PalletItem[]> {
    return this.findByField('skuId', skuId);
  }

  async deleteByPallet(palletId: string): Promise<void> {
    const items = await this.findByPallet(palletId);
    await Promise.all(items.map(item => this.delete(item.id)));
  }
}

export class FirebaseManifestRepository extends BaseFirebaseRepository<Manifest, ManifestCreate> implements IManifestRepository {
  constructor() {
    super('manifests');
  }

  async findByCode(code: string): Promise<Manifest | null> {
    return this.findOneByField('code', code);
  }

  async findByStatus(status: string): Promise<Manifest[]> {
    return this.findByField('status', status);
  }

  async findByContract(contractId: string): Promise<Manifest[]> {
    return this.findByField('contractId', contractId);
  }

  async generateCode(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `MAN-${timestamp}-${random}`;
  }
}

export class FirebaseManifestPalletRepository extends BaseFirebaseRepository<ManifestPallet, Omit<ManifestPallet, 'id' | 'createdAt' | 'updatedAt'>> implements IManifestPalletRepository {
  constructor() {
    super('manifestPallets');
  }

  async findByManifest(manifestId: string): Promise<ManifestPallet[]> {
    return this.findByField('manifestId', manifestId);
  }

  async findByPallet(palletId: string): Promise<ManifestPallet | null> {
    return this.findOneByField('palletId', palletId);
  }

  async deleteByManifest(manifestId: string): Promise<void> {
    const items = await this.findByManifest(manifestId);
    await Promise.all(items.map(item => this.delete(item.id)));
  }
}

export class FirebaseReceiptRepository extends BaseFirebaseRepository<Receipt, ReceiptCreate> implements IReceiptRepository {
  constructor() {
    super('receipts');
  }

  async findByPallet(palletId: string): Promise<Receipt | null> {
    return this.findOneByField('palletId', palletId);
  }

  async findByLocation(locationId: string): Promise<Receipt[]> {
    return this.findByField('destinationLocationId', locationId);
  }

  async findByLocationAndDateRange(
    locationId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 50,
    startAfter?: string
  ): Promise<Receipt[]> {
    const filters = [
      { field: 'destinationLocationId', operator: '==', value: locationId }
    ];

    if (startDate) {
      filters.push({ field: 'receivedAt', operator: '>=', value: startDate.toISOString() });
    }
    if (endDate) {
      filters.push({ field: 'receivedAt', operator: '<=', value: endDate.toISOString() });
    }

    return this.executeComplexQuery(filters, limit, 'receivedAt', 'desc', startAfter);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Receipt[]> {
    const filters = [
      { field: 'receivedAt', operator: '>=', value: startDate },
      { field: 'receivedAt', operator: '<=', value: endDate }
    ];
    return this.executeComplexQuery(filters, 50, 'receivedAt', 'desc');
  }
}

export class FirebaseComparisonRepository extends BaseFirebaseRepository<Comparison, Omit<Comparison, 'id' | 'createdAt' | 'updatedAt'>> implements IComparisonRepository {
  constructor() {
    super('comparisons');
  }

  async findByPallet(palletId: string): Promise<Comparison[]> {
    return this.findByField('palletId', palletId);
  }

  async findByStatus(status: ComparisonStatus): Promise<Comparison[]> {
    return this.findByFilters(status);
  }

  async findByFilters(
    status?: ComparisonStatus,
    contractId?: string,
    skuId?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 50,
    startAfter?: string
  ): Promise<Comparison[]> {
    const filters = [];
    if (status) filters.push({ field: 'status', operator: '==', value: status });
    if (contractId) filters.push({ field: 'contractId', operator: '==', value: contractId });
    if (skuId) filters.push({ field: 'skuId', operator: '==', value: skuId });
    if (startDate) filters.push({ field: 'createdAt', operator: '>=', value: startDate });
    if (endDate) filters.push({ field: 'createdAt', operator: '<=', value: endDate });
    
    return this.executeComplexQuery(filters, limit, 'createdAt', 'desc', startAfter);
  }

  async findCriticalDifferences(): Promise<Comparison[]> {
    return this.findByField('status', 'critico');
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Comparison[]> {
    const filters = [
      { field: 'createdAt', operator: '>=', value: startDate },
      { field: 'createdAt', operator: '<=', value: endDate }
    ];
    return this.executeComplexQuery(filters, 50, 'createdAt', 'desc');
  }
}

export class FirebaseAuditLogRepository extends BaseFirebaseRepository<AuditLog, Omit<AuditLog, 'id' | 'createdAt' | 'updatedAt'>> implements IAuditLogRepository {
  constructor() {
    super('auditLogs');
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    limit: number = 50,
    startAfter?: string
  ): Promise<AuditLog[]> {
    const filters = [
      { field: 'entityType', operator: '==', value: entityType },
      { field: 'entityId', operator: '==', value: entityId }
    ];
    return this.executeComplexQuery(filters, limit, 'timestamp', 'desc', startAfter);
  }

  async findByUser(userId: string): Promise<AuditLog[]> {
    return this.findByField('userId', userId);
  }

  async findByFilters(
    entityType?: string,
    entityId?: string,
    userId?: string,
    action?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
    startAfter?: string
  ): Promise<AuditLog[]> {
    const filters = [];
    if (entityType) filters.push({ field: 'entityType', operator: '==', value: entityType });
    if (entityId) filters.push({ field: 'entityId', operator: '==', value: entityId });
    if (userId) filters.push({ field: 'userId', operator: '==', value: userId });
    if (action) filters.push({ field: 'action', operator: '==', value: action });
    if (startDate) filters.push({ field: 'timestamp', operator: '>=', value: startDate });
    if (endDate) filters.push({ field: 'timestamp', operator: '<=', value: endDate });
    
    return this.executeComplexQuery(filters, limit, 'timestamp', 'desc', startAfter);
  }

  async findByAction(action: string): Promise<AuditLog[]> {
    return this.findByField('action', action);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
    const filters = [
      { field: 'timestamp', operator: '>=', value: startDate },
      { field: 'timestamp', operator: '<=', value: endDate }
    ];
    return this.executeComplexQuery(filters, 100, 'timestamp', 'desc');
  }
}
