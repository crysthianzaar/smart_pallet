import {
  User, UserCreate,
  Contract, ContractCreate,
  Location, LocationCreate,
  Sku, SkuCreate,
  Pallet, PalletCreate,
  PalletItem, PalletItemCreate,
  Manifest, ManifestCreate,
  ManifestPallet,
  Receipt, ReceiptCreate,
  Comparison,
  AuditLog,
} from '../models';

// Base repository interface
export interface IBaseRepository<T, TCreate> {
  create(data: TCreate): Promise<T>;
  findById(id: string): Promise<T | null>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  list(limit?: number, startAfter?: string): Promise<T[]>;
}

// User repository
export interface IUserRepository extends IBaseRepository<User, UserCreate> {
  findByEmail(email: string): Promise<User | null>;
  findByRole(role: string): Promise<User[]>;
}

// Contract repository
export interface IContractRepository extends IBaseRepository<Contract, ContractCreate> {
  findByCode(code: string): Promise<Contract | null>;
  findActive(): Promise<Contract[]>;
}

// Location repository
export interface ILocationRepository extends IBaseRepository<Location, LocationCreate> {
  findByCode(code: string): Promise<Location | null>;
  findActive(): Promise<Location[]>;
}

// SKU repository
export interface ISkuRepository extends IBaseRepository<Sku, SkuCreate> {
  findByCode(code: string): Promise<Sku | null>;
  findActive(): Promise<Sku[]>;
}

// Pallet repository
export interface IPalletRepository extends IBaseRepository<Pallet, PalletCreate> {
  findByQr(qr: string): Promise<Pallet | null>;
  findByStatus(status: string): Promise<Pallet[]>;
  findByContract(contractId: string): Promise<Pallet[]>;
  findByLocation(locationId: string): Promise<Pallet[]>;
  findRequiringManualReview(): Promise<Pallet[]>;
}

// Pallet Item repository
export interface IPalletItemRepository extends IBaseRepository<PalletItem, PalletItemCreate> {
  findByPallet(palletId: string): Promise<PalletItem[]>;
  findBySku(skuId: string): Promise<PalletItem[]>;
  deleteByPallet(palletId: string): Promise<void>;
}

// Manifest repository
export interface IManifestRepository extends IBaseRepository<Manifest, ManifestCreate> {
  findByCode(code: string): Promise<Manifest | null>;
  findByStatus(status: string): Promise<Manifest[]>;
  findByContract(contractId: string): Promise<Manifest[]>;
  generateCode(): Promise<string>;
}

// Manifest Pallet repository
export interface IManifestPalletRepository extends IBaseRepository<ManifestPallet, Omit<ManifestPallet, 'id' | 'createdAt' | 'updatedAt'>> {
  findByManifest(manifestId: string): Promise<ManifestPallet[]>;
  findByPallet(palletId: string): Promise<ManifestPallet | null>;
  deleteByManifest(manifestId: string): Promise<void>;
}

// Receipt repository
export interface IReceiptRepository extends IBaseRepository<Receipt, ReceiptCreate> {
  findByPallet(palletId: string): Promise<Receipt | null>;
  findByLocation(locationId: string): Promise<Receipt[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Receipt[]>;
}

// Comparison repository
export interface IComparisonRepository extends IBaseRepository<Comparison, Omit<Comparison, 'id' | 'createdAt' | 'updatedAt'>> {
  findByPallet(palletId: string): Promise<Comparison[]>;
  findByStatus(status: string): Promise<Comparison[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Comparison[]>;
  findCriticalDifferences(): Promise<Comparison[]>;
}

// Audit Log repository
export interface IAuditLogRepository extends IBaseRepository<AuditLog, Omit<AuditLog, 'id' | 'createdAt' | 'updatedAt'>> {
  findByEntity(entityType: string, entityId: string): Promise<AuditLog[]>;
  findByUser(userId: string): Promise<AuditLog[]>;
  findByAction(action: string): Promise<AuditLog[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]>;
}

// File repository for Storage operations
export interface IFileRepository {
  uploadFile(path: string, file: Buffer | Uint8Array, contentType: string): Promise<string>;
  getDownloadUrl(path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  generateSignedUploadUrl(path: string, contentType: string): Promise<{ uploadUrl: string; downloadUrl: string }>;
}

// Repository factory interface
export interface IRepositoryFactory {
  getUserRepository(): IUserRepository;
  getContractRepository(): IContractRepository;
  getLocationRepository(): ILocationRepository;
  getSkuRepository(): ISkuRepository;
  getPalletRepository(): IPalletRepository;
  getPalletItemRepository(): IPalletItemRepository;
  getManifestRepository(): IManifestRepository;
  getManifestPalletRepository(): IManifestPalletRepository;
  getReceiptRepository(): IReceiptRepository;
  getComparisonRepository(): IComparisonRepository;
  getAuditLogRepository(): IAuditLogRepository;
  getFileRepository(): IFileRepository;
}
