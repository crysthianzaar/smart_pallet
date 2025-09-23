import QRCode from 'qrcode';
import { Pallet, PalletItem, PalletCreate, CountReview } from '../models';
import { IRepositoryFactory } from '../repo/interfaces';

// Configuration constants
const IA_CONF_THRESHOLD = parseFloat(process.env.IA_CONF_THRESHOLD || '0.65');
const MAX_SKUS_PER_PALLET = 2;

export class CreatePalletTask {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(data: PalletCreate, userId: string): Promise<Pallet> {
    // Validate contract and location exist
    const contractRepo = this.repositoryFactory.getContractRepository();
    const locationRepo = this.repositoryFactory.getLocationRepository();
    
    const contract = await contractRepo.findById(data.contractOriginId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    const location = await locationRepo.findById(data.locationOriginId);
    if (!location) {
      throw new Error('Location not found');
    }

    // Generate QR code
    const palletRepo = this.repositoryFactory.getPalletRepository();
    const tempId = `temp_${Date.now()}`;
    const qrData = `PALLET:${tempId};CONTRACT:${data.contractOriginId}`;
    
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    // Create pallet
    const pallet = await palletRepo.create({
      ...data,
      status: 'rascunho',
      qr: qrData,
      confGlobal: null,
      requiresManualReview: false,
      sealedBy: null,
      sealedAt: null,
      photos: [],
    });

    // Update QR with actual pallet ID
    const actualQrData = `PALLET:${pallet.id};CONTRACT:${data.contractOriginId}`;
    const updatedPallet = await palletRepo.update(pallet.id, { qr: actualQrData });

    // Create audit log
    await this.createAuditLog('pallet_created', 'pallet', pallet.id, userId, {
      contractId: data.contractOriginId,
      locationId: data.locationOriginId,
    });

    return updatedPallet;
  }

  private async createAuditLog(action: string, entityType: string, entityId: string, userId: string, details: any) {
    const auditRepo = this.repositoryFactory.getAuditLogRepository();
    await auditRepo.create({
      action: action as any,
      entityType,
      entityId,
      userId,
      details,
      timestamp: new Date(),
    });
  }
}

export class AttachPhotosTask {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(palletId: string, photoUrls: string[], userId: string): Promise<Pallet> {
    const palletRepo = this.repositoryFactory.getPalletRepository();
    
    const pallet = await palletRepo.findById(palletId);
    if (!pallet) {
      throw new Error('Pallet not found');
    }

    if (pallet.status !== 'rascunho') {
      throw new Error('Cannot attach photos to sealed pallet');
    }

    // Update pallet with photos
    const updatedPallet = await palletRepo.update(palletId, {
      photos: [...pallet.photos, ...photoUrls],
    });

    // Create audit log
    await this.createAuditLog('photos_captured', 'pallet', palletId, userId, {
      photoCount: photoUrls.length,
      totalPhotos: updatedPallet.photos.length,
    });

    return updatedPallet;
  }

  private async createAuditLog(action: string, entityType: string, entityId: string, userId: string, details: any) {
    const auditRepo = this.repositoryFactory.getAuditLogRepository();
    await auditRepo.create({
      action: action as any,
      entityType,
      entityId,
      userId,
      details,
      timestamp: new Date(),
    });
  }
}

export class SuggestCountTask {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(palletId: string): Promise<{ confGlobal: number; items: PalletItem[] }> {
    // TODO: Replace with real AI integration
    // This is a stub implementation that simulates AI confidence based on photos
    
    const palletRepo = this.repositoryFactory.getPalletRepository();
    const palletItemRepo = this.repositoryFactory.getPalletItemRepository();
    
    const pallet = await palletRepo.findById(palletId);
    if (!pallet) {
      throw new Error('Pallet not found');
    }

    const items = await palletItemRepo.findByPallet(palletId);
    
    // Simulate AI confidence calculation
    const hasPhotos = pallet.photos.length >= 3;
    const baseConfidence = hasPhotos ? 0.8 : 0.4;
    const randomVariation = (Math.random() - 0.5) * 0.3; // ±15%
    const confGlobal = Math.max(0.1, Math.min(0.95, baseConfidence + randomVariation));

    // Simulate item-level confidence and quantities
    const updatedItems: PalletItem[] = [];
    for (const item of items) {
      const itemConfidence = confGlobal + (Math.random() - 0.5) * 0.2;
      const qtdIa = Math.floor(Math.random() * 50) + 1; // Random quantity 1-50
      
      const updatedItem = await palletItemRepo.update(item.id, {
        qtdIa,
        confMedia: Math.max(0.1, Math.min(0.95, itemConfidence)),
      });
      
      updatedItems.push(updatedItem);
    }

    // Update pallet with global confidence
    await palletRepo.update(palletId, { confGlobal });

    return { confGlobal, items: updatedItems };
  }
}

export class EnforceManualReviewTask {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(palletId: string, confGlobal: number): Promise<boolean> {
    const palletRepo = this.repositoryFactory.getPalletRepository();
    
    const requiresManualReview = confGlobal < IA_CONF_THRESHOLD;
    
    await palletRepo.update(palletId, { requiresManualReview });
    
    return requiresManualReview;
  }
}

export class SealPalletTask {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(palletId: string, userId: string, countReview?: CountReview): Promise<Pallet> {
    const palletRepo = this.repositoryFactory.getPalletRepository();
    const palletItemRepo = this.repositoryFactory.getPalletItemRepository();
    
    const pallet = await palletRepo.findById(palletId);
    if (!pallet) {
      throw new Error('Pallet not found');
    }

    if (pallet.status !== 'rascunho') {
      throw new Error('Pallet is already sealed');
    }

    // Check if manual review is required and confirmed
    if (pallet.requiresManualReview && (!countReview || !countReview.manualReviewConfirmed)) {
      throw new Error('Manual review confirmation required before sealing');
    }

    // Get pallet items and validate SKU count
    const items = await palletItemRepo.findByPallet(palletId);
    if (items.length > MAX_SKUS_PER_PALLET) {
      throw new Error(`Pallet cannot have more than ${MAX_SKUS_PER_PALLET} SKUs`);
    }

    // Apply manual adjustments if provided
    if (countReview) {
      for (const adjustment of countReview.items) {
        const item = items.find(i => i.skuId === adjustment.skuId);
        if (item) {
          await palletItemRepo.update(item.id, {
            qtdAjustada: adjustment.qtdAjustada,
            ajustadoPor: userId,
            ajustadoEm: new Date(),
          });
        }
      }
    }

    // Seal the pallet
    const sealedPallet = await palletRepo.update(palletId, {
      status: 'selado',
      sealedBy: userId,
      sealedAt: new Date(),
    });

    // Create audit log
    await this.createAuditLog('pallet_sealed', 'pallet', palletId, userId, {
      itemCount: items.length,
      manualReviewRequired: pallet.requiresManualReview,
      adjustmentsMade: countReview ? countReview.items.length : 0,
    });

    return sealedPallet;
  }

  private async createAuditLog(action: string, entityType: string, entityId: string, userId: string, details: any) {
    const auditRepo = this.repositoryFactory.getAuditLogRepository();
    await auditRepo.create({
      action: action as any,
      entityType,
      entityId,
      userId,
      details,
      timestamp: new Date(),
    });
  }
}
