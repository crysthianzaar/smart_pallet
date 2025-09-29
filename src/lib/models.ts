import { z } from 'zod';

// Enums
export const ContractStatus = z.enum(['active', 'inactive']);
export const LocationType = z.enum(['origem', 'destino', 'estoque']);
export const LocationStatus = z.enum(['active', 'inactive']);
export const SkuStatus = z.enum(['active', 'inactive']);
export const QrTagStatus = z.enum(['livre', 'vinculado']);
export const PalletStatus = z.enum(['ativo', 'em_manifesto', 'em_transito', 'recebido', 'finalizado']);
export const PhotoType = z.enum(['frontal', 'lateral', 'superior']);
export const PhotoStage = z.enum(['origem', 'destino']);
export const ManifestStatus = z.enum(['rascunho', 'carregado', 'em_transito', 'entregue']);
export const ReceiptStatus = z.enum(['ok', 'alerta', 'critico']);
export const DifferenceType = z.enum(['falta', 'sobra', 'avaria', 'troca']);

// Contract Models
export const ContractSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  company: z.string().min(1),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  status: ContractStatus.default('active'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const ContractCreateSchema = ContractSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const ContractUpdateSchema = ContractCreateSchema.partial();

// Location Models
export const LocationSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: LocationType,
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  contract_id: z.string().optional(),
  status: LocationStatus.default('active'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const LocationCreateSchema = LocationSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const LocationUpdateSchema = LocationCreateSchema.partial();

// SKU Models
export const SkuSchema = z.object({
  id: z.string(),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().min(1),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  unit_price: z.number().positive().optional(),
  status: SkuStatus.default('active'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const SkuCreateSchema = SkuSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const SkuUpdateSchema = SkuCreateSchema.partial();

// QR Tag Models
export const QrTagSchema = z.object({
  id: z.string(),
  qr_code: z.string().min(1),
  status: QrTagStatus.default('livre'),
  current_pallet_id: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const QrTagCreateSchema = QrTagSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const QrTagUpdateSchema = QrTagCreateSchema.partial();

// Pallet Models
export const PalletSchema = z.object({
  id: z.string(),
  qr_tag_id: z.string(),
  contract_id: z.string(),
  origin_location_id: z.string(),
  destination_location_id: z.string().optional(),
  status: PalletStatus.default('ativo'),
  ai_confidence: z.number().min(0).max(100).optional(),
  requires_manual_review: z.boolean().default(false),
  // observations: z.string().optional(), // Temporarily removed until DB is updated
  sealed_at: z.string().datetime().optional(),
  sealed_by: z.string().optional(),
  created_by: z.string(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const PalletCreateSchema = PalletSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const PalletUpdateSchema = PalletCreateSchema.partial();

// Pallet Photo Models
export const PalletPhotoSchema = z.object({
  id: z.string(),
  pallet_id: z.string(),
  photo_type: PhotoType,
  file_path: z.string(),
  stage: PhotoStage,
  created_at: z.string().datetime().optional(),
});

export const PalletPhotoCreateSchema = PalletPhotoSchema.omit({ 
  id: true, 
  created_at: true 
});

// Pallet Item Models
export const PalletItemSchema = z.object({
  id: z.string(),
  pallet_id: z.string(),
  sku_id: z.string(),
  quantity_origin: z.number().int().min(0).default(0),
  quantity_destination: z.number().int().min(0).default(0),
  ai_suggested_quantity: z.number().int().min(0).default(0),
  manual_count_origin: z.number().int().min(0).default(0),
  manual_count_destination: z.number().int().min(0).default(0),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const PalletItemCreateSchema = PalletItemSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const PalletItemUpdateSchema = PalletItemCreateSchema.partial();

// Manifest Models
export const ManifestSchema = z.object({
  id: z.string(),
  manifest_number: z.string(),
  contract_id: z.string(),
  origin_location_id: z.string(),
  destination_location_id: z.string(),
  driver_name: z.string().min(1),
  vehicle_plate: z.string().min(1),
  status: ManifestStatus.default('rascunho'),
  pdf_path: z.string().optional(),
  loaded_at: z.string().datetime().optional(),
  created_by: z.string(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const ManifestCreateSchema = ManifestSchema.omit({ 
  id: true, 
  manifest_number: true,
  created_at: true, 
  updated_at: true 
});

export const ManifestUpdateSchema = ManifestCreateSchema.partial();

// Manifest Pallet Models
export const ManifestPalletSchema = z.object({
  id: z.string(),
  manifest_id: z.string(),
  pallet_id: z.string(),
  loaded_at: z.string().datetime().optional(),
  created_at: z.string().datetime().optional(),
});

export const ManifestPalletCreateSchema = ManifestPalletSchema.omit({ 
  id: true, 
  created_at: true 
});

// Receipt Models
export const ReceiptSchema = z.object({
  id: z.string(),
  pallet_id: z.string().optional(),
  manifest_id: z.string(),
  received_by: z.string(),
  received_at: z.string().datetime(),
  status: ReceiptStatus.default('ok'),
  observations: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const ReceiptCreateSchema = ReceiptSchema.omit({ 
  id: true, 
  received_at: true,
  created_at: true,
  updated_at: true
});

export const ReceiptUpdateSchema = ReceiptCreateSchema.partial();

// Comparison Models
export const ComparisonSchema = z.object({
  id: z.string(),
  receipt_id: z.string(),
  pallet_id: z.string(),
  sku_id: z.string(),
  quantity_origin: z.number().int().min(0),
  quantity_destination: z.number().int().min(0),
  difference: z.number().int(),
  difference_type: DifferenceType.optional(),
  reason: z.string().optional(),
  evidence_photos: z.string().optional(), // JSON string
  created_at: z.string().datetime().optional(),
});

export const ComparisonCreateSchema = ComparisonSchema.omit({ 
  id: true, 
  created_at: true 
});

// Audit Log Models
export const AuditLogSchema = z.object({
  id: z.string(),
  entity_type: z.string(),
  entity_id: z.string(),
  action: z.string(),
  user_id: z.string(),
  old_values: z.string().optional(), // JSON string
  new_values: z.string().optional(), // JSON string
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  created_at: z.string().datetime().optional(),
});

export const AuditLogCreateSchema = AuditLogSchema.omit({ 
  id: true, 
  created_at: true 
});

// Type exports
export type Contract = z.infer<typeof ContractSchema>;
export type ContractCreate = z.infer<typeof ContractCreateSchema>;
export type ContractUpdate = z.infer<typeof ContractUpdateSchema>;

export type Location = z.infer<typeof LocationSchema>;
export type LocationCreate = z.infer<typeof LocationCreateSchema>;
export type LocationUpdate = z.infer<typeof LocationUpdateSchema>;

export type Sku = z.infer<typeof SkuSchema>;
export type SkuCreate = z.infer<typeof SkuCreateSchema>;
export type SkuUpdate = z.infer<typeof SkuUpdateSchema>;

export type QrTag = z.infer<typeof QrTagSchema>;
export type QrTagCreate = z.infer<typeof QrTagCreateSchema>;
export type QrTagUpdate = z.infer<typeof QrTagUpdateSchema>;

export type Pallet = z.infer<typeof PalletSchema>;
export type PalletCreate = z.infer<typeof PalletCreateSchema>;
export type PalletUpdate = z.infer<typeof PalletUpdateSchema>;

export type PalletPhoto = z.infer<typeof PalletPhotoSchema>;
export type PalletPhotoCreate = z.infer<typeof PalletPhotoCreateSchema>;

export type PalletItem = z.infer<typeof PalletItemSchema>;
export type PalletItemCreate = z.infer<typeof PalletItemCreateSchema>;
export type PalletItemUpdate = z.infer<typeof PalletItemUpdateSchema>;

export type Manifest = z.infer<typeof ManifestSchema>;
export type ManifestCreate = z.infer<typeof ManifestCreateSchema>;
export type ManifestUpdate = z.infer<typeof ManifestUpdateSchema>;

export type ManifestPallet = z.infer<typeof ManifestPalletSchema>;
export type ManifestPalletCreate = z.infer<typeof ManifestPalletCreateSchema>;

export type Receipt = z.infer<typeof ReceiptSchema>;
export type ReceiptCreate = z.infer<typeof ReceiptCreateSchema>;
export type ReceiptUpdate = z.infer<typeof ReceiptUpdateSchema>;

export type Comparison = z.infer<typeof ComparisonSchema>;
export type ComparisonCreate = z.infer<typeof ComparisonCreateSchema>;

export type AuditLog = z.infer<typeof AuditLogSchema>;
export type AuditLogCreate = z.infer<typeof AuditLogCreateSchema>;
