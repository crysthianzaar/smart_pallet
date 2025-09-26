import z from "zod";

// Base schemas
export const BaseEntitySchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// User schemas
export const UserRoleSchema = z.enum(['admin', 'conferente']);

export const UserSchema = BaseEntitySchema.extend({
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema,
  isActive: z.boolean().default(true),
});

export const UserCreateSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema,
  password: z.string().min(6),
});

// Contract schemas
export const ContractSchema = BaseEntitySchema.extend({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const ContractCreateSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

// Location schemas
export const LocationSchema = BaseEntitySchema.extend({
  code: z.string(),
  name: z.string(),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const LocationCreateSchema = z.object({
  code: z.string(),
  name: z.string(),
  address: z.string().optional(),
});

// SKU schemas
export const SkuSchema = BaseEntitySchema.extend({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  unit: z.string(),
  isActive: z.boolean().default(true),
});

export const SkuCreateSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  unit: z.string(),
});

// Pallet schemas
export const PalletStatusSchema = z.enum(['ativo', 'em_manifesto', 'em_transito', 'recebido', 'finalizado']);

export const PalletSchema = BaseEntitySchema.extend({
  contractOriginId: z.string(),
  locationOriginId: z.string(),
  status: PalletStatusSchema,
  qr: z.string(),
  confGlobal: z.number().nullable(),
  requiresManualReview: z.boolean().default(false),
  sealedBy: z.string().nullable(),
  sealedAt: z.date().nullable(),
  photos: z.array(z.string()).default([]),
});

export const PalletCreateSchema = z.object({
  contractOriginId: z.string(),
  locationOriginId: z.string(),
  status: PalletStatusSchema.optional(),
  qr: z.string().optional(),
  confGlobal: z.number().nullable().optional(),
  requiresManualReview: z.boolean().optional(),
  sealedBy: z.string().nullable().optional(),
  sealedAt: z.date().nullable().optional(),
  photos: z.array(z.string()).optional(),
});

// Pallet Item schemas
export const PalletItemSchema = BaseEntitySchema.extend({
  palletId: z.string(),
  skuId: z.string(),
  qtdIa: z.number().nullable(),
  confMedia: z.number().nullable(),
  qtdAjustada: z.number().nullable(),
  ajustadoPor: z.string().nullable(),
  ajustadoEm: z.date().nullable(),
});

export const PalletItemCreateSchema = z.object({
  palletId: z.string(),
  skuId: z.string(),
  qtdIa: z.number().optional(),
  confMedia: z.number().optional(),
});

export const CountReviewSchema = z.object({
  palletId: z.string(),
  items: z.array(z.object({
    skuId: z.string(),
    qtdAjustada: z.number(),
  })),
  manualReviewConfirmed: z.boolean().default(false),
});

// Manifest schemas
export const ManifestStatusSchema = z.enum(['rascunho', 'carregado', 'em_transito', 'entregue']);

export const ManifestSchema = BaseEntitySchema.extend({
  code: z.string(),
  contractId: z.string(),
  originLocationId: z.string(),
  destinationLocationId: z.string(),
  status: ManifestStatusSchema,
  loadedBy: z.string().nullable(),
  loadedAt: z.date().nullable(),
  pdfUrl: z.string().nullable(),
});

export const ManifestCreateSchema = z.object({
  contractId: z.string(),
  originLocationId: z.string(),
  destinationLocationId: z.string(),
});

// Manifest Pallet schemas
export const ManifestPalletSchema = BaseEntitySchema.extend({
  manifestId: z.string(),
  palletId: z.string(),
  addedBy: z.string(),
  addedAt: z.date(),
});

// Receipt schemas
export const ReceiptSchema = BaseEntitySchema.extend({
  palletId: z.string(),
  receivedBy: z.string(),
  receivedAt: z.date(),
  destinationLocationId: z.string(),
  photos: z.array(z.string()).default([]),
  observations: z.string().optional(),
});

export const ReceiptCreateSchema = z.object({
  palletId: z.string(),
  receivedBy: z.string(),
  destinationLocationId: z.string(),
  photos: z.array(z.string()).optional(),
  observations: z.string().optional(),
});

// Comparison schemas
export const ComparisonStatusSchema = z.enum(['ok', 'alerta', 'critico']);

export const ComparisonSchema = BaseEntitySchema.extend({
  palletId: z.string(),
  skuId: z.string(),
  origemQtd: z.number(),
  destinoQtd: z.number(),
  delta: z.number(),
  status: ComparisonStatusSchema,
  motivo: z.string().optional(),
  evidencias: z.array(z.string()).default([]),
});

// Audit Log schemas
export const AuditActionSchema = z.enum([
  'pallet_created',
  'pallet_sealed',
  'photos_captured',
  'count_reviewed',
  'manifest_created',
  'pallet_added_to_manifest',
  'pallet_removed_from_manifest',
  'manifest_loaded',
  'pallet_received',
  'comparison_created',
  'user_created',
  'contract_created',
  'contract_updated',
  'location_created',
  'location_updated',
  'sku_created',
  'sku_updated',
]);

export const AuditLogSchema = BaseEntitySchema.extend({
  action: AuditActionSchema,
  entityType: z.string(),
  entityId: z.string(),
  userId: z.string(),
  details: z.record(z.any()),
  timestamp: z.date(),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;

export type Contract = z.infer<typeof ContractSchema>;
export type ContractCreate = z.infer<typeof ContractCreateSchema>;

export type Location = z.infer<typeof LocationSchema>;
export type LocationCreate = z.infer<typeof LocationCreateSchema>;

export type Sku = z.infer<typeof SkuSchema>;
export type SkuCreate = z.infer<typeof SkuCreateSchema>;

export type Pallet = z.infer<typeof PalletSchema>;
export type PalletCreate = z.infer<typeof PalletCreateSchema>;
export type PalletStatus = z.infer<typeof PalletStatusSchema>;

export type PalletItem = z.infer<typeof PalletItemSchema>;
export type PalletItemCreate = z.infer<typeof PalletItemCreateSchema>;
export type CountReview = z.infer<typeof CountReviewSchema>;

export type Manifest = z.infer<typeof ManifestSchema>;
export type ManifestCreate = z.infer<typeof ManifestCreateSchema>;
export type ManifestStatus = z.infer<typeof ManifestStatusSchema>;

export type ManifestPallet = z.infer<typeof ManifestPalletSchema>;

export type Receipt = z.infer<typeof ReceiptSchema>;
export type ReceiptCreate = z.infer<typeof ReceiptCreateSchema>;

export type Comparison = z.infer<typeof ComparisonSchema>;
export type ComparisonStatus = z.infer<typeof ComparisonStatusSchema>;

export type AuditLog = z.infer<typeof AuditLogSchema>;
export type AuditAction = z.infer<typeof AuditActionSchema>;
