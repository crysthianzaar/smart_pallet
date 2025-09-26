import { Receipt, ReceiptCreate, Comparison } from '../models';
import { IRepositoryFactory } from '../repo/interfaces';

// Configuration constants
const DELTA_ALERT = parseInt(process.env.DELTA_ALERT || '2');
const DELTA_CRITICAL = parseInt(process.env.DELTA_CRITICAL || '5');

export class ReceivePalletTask {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(data: ReceiptCreate, userId: string): Promise<Receipt> {
    const palletRepo = this.repositoryFactory.getPalletRepository();
    const locationRepo = this.repositoryFactory.getLocationRepository();
    const receiptRepo = this.repositoryFactory.getReceiptRepository();

    // Validate pallet exists and is in transport
    const pallet = await palletRepo.findById(data.palletId);
    if (!pallet) {
      throw new Error('Pallet not found');
    }

    if (pallet.status !== 'em_transito') {
      throw new Error('Pallet is not in transport status');
    }

    // Validate destination location exists
    const location = await locationRepo.findById(data.destinationLocationId);
    if (!location) {
      throw new Error('Destination location not found');
    }

    // Check if pallet is already received
    const existingReceipt = await receiptRepo.findByPallet(data.palletId);
    if (existingReceipt) {
      throw new Error('Pallet is already received');
    }

    // Create receipt
    const receipt = await receiptRepo.create({
      ...data,
      receivedBy: userId,
      photos: data.photos || [],
    });

    // Update pallet status to received
    await palletRepo.update(data.palletId, {
      status: 'recebido',
    });

    // Create audit log
    await this.createAuditLog('pallet_received', 'pallet', data.palletId, userId, {
      destinationLocationId: data.destinationLocationId,
      photoCount: receipt.photos.length,
      observations: data.observations,
    });

    return receipt;
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

export class CompareOriginDestTask {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(palletId: string, destinationCounts: { skuId: string; qtd: number }[], userId: string): Promise<Comparison[]> {
    const palletItemRepo = this.repositoryFactory.getPalletItemRepository();
    const comparisonRepo = this.repositoryFactory.getComparisonRepository();

    // Get origin items
    const originItems = await palletItemRepo.findByPallet(palletId);
    if (originItems.length === 0) {
      throw new Error('No origin items found for pallet');
    }

    const comparisons: Comparison[] = [];

    // Compare each SKU
    for (const originItem of originItems) {
      const destinationItem = destinationCounts.find(d => d.skuId === originItem.skuId);
      const destinationQtd = destinationItem?.qtd || 0;
      
      // Use adjusted quantity if available, otherwise use AI quantity
      const originQtd = originItem.qtdAjustada ?? originItem.qtdIa ?? 0;
      
      const delta = Math.abs(originQtd - destinationQtd);
      const status = this.calculateComparisonStatus(delta);

      const comparison = await comparisonRepo.create({
        palletId,
        skuId: originItem.skuId,
        origemQtd: originQtd,
        destinoQtd: destinationQtd,
        delta,
        status,
        motivo: undefined,
        evidencias: [],
      });

      comparisons.push(comparison);
    }

    // Check for SKUs that exist in destination but not in origin
    for (const destinationItem of destinationCounts) {
      const originExists = originItems.some(o => o.skuId === destinationItem.skuId);
      if (!originExists) {
        const comparison = await comparisonRepo.create({
          palletId,
          skuId: destinationItem.skuId,
          origemQtd: 0,
          destinoQtd: destinationItem.qtd,
          delta: destinationItem.qtd,
          status: this.calculateComparisonStatus(destinationItem.qtd),
          motivo: undefined,
          evidencias: [],
        });

        comparisons.push(comparison);
      }
    }

    // Create audit log
    await this.createAuditLog('comparison_created', 'pallet', palletId, userId, {
      comparisonCount: comparisons.length,
      criticalCount: comparisons.filter(c => c.status === 'critico').length,
      alertCount: comparisons.filter(c => c.status === 'alerta').length,
    });

    return comparisons;
  }

  private calculateComparisonStatus(delta: number): 'ok' | 'alerta' | 'critico' {
    if (delta >= DELTA_CRITICAL) {
      return 'critico';
    } else if (delta >= DELTA_ALERT) {
      return 'alerta';
    } else {
      return 'ok';
    }
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

export class UpdateComparisonTask {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(comparisonId: string, motivo?: string, evidencias?: string[]): Promise<Comparison> {
    const comparisonRepo = this.repositoryFactory.getComparisonRepository();

    const comparison = await comparisonRepo.findById(comparisonId);
    if (!comparison) {
      throw new Error('Comparison not found');
    }

    // Validate that motivo is required for alert/critical status
    if ((comparison.status === 'alerta' || comparison.status === 'critico') && !motivo) {
      throw new Error('Motivo is required for alert and critical differences');
    }

    const updatedComparison = await comparisonRepo.update(comparisonId, {
      motivo,
      evidencias: evidencias || comparison.evidencias,
    });

    return updatedComparison;
  }
}
