import { IRepositoryFactory } from '../repo/interfaces';
import { Comparison, Pallet, PalletItem } from '../models';

export interface KpiData {
  totalPallets: number;
  lowConfidencePallets: number;
  lowConfidencePercentage: number;
  averageDivergence: number;
  criticalDifferences: number;
  alertDifferences: number;
  topSkusWithDifferences: Array<{
    skuId: string;
    skuName?: string;
    totalDifferences: number;
    averageDelta: number;
  }>;
}

export interface DifferenceListItem {
  id: string;
  palletId: string;
  palletQr?: string;
  skuId: string;
  skuName?: string;
  origemQtd: number;
  destinoQtd: number;
  delta: number;
  status: 'ok' | 'alerta' | 'critico';
  motivo?: string;
  createdAt: Date;
}

export class KpiDashboardTask {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(startDate?: Date, endDate?: Date, contractId?: string): Promise<KpiData> {
    const palletRepo = this.repositoryFactory.getPalletRepository();
    const comparisonRepo = this.repositoryFactory.getComparisonRepository();
    const skuRepo = this.repositoryFactory.getSkuRepository();

    // Get all pallets (with optional filtering)
    let pallets: Pallet[] = [];
    if (contractId) {
      pallets = await palletRepo.findByContract(contractId);
    } else {
      pallets = await palletRepo.list(1000); // Get a large number for KPI calculation
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      pallets = pallets.filter(pallet => {
        const palletDate = pallet.createdAt;
        if (startDate && palletDate < startDate) return false;
        if (endDate && palletDate > endDate) return false;
        return true;
      });
    }

    const totalPallets = pallets.length;
    const lowConfidencePallets = pallets.filter(p => p.requiresManualReview).length;
    const lowConfidencePercentage = totalPallets > 0 ? (lowConfidencePallets / totalPallets) * 100 : 0;

    // Get comparisons for the filtered pallets
    const palletIds = pallets.map(p => p.id);
    let allComparisons: Comparison[] = [];
    
    for (const palletId of palletIds) {
      const comparisons = await comparisonRepo.findByPallet(palletId);
      allComparisons = allComparisons.concat(comparisons);
    }

    // Calculate divergence metrics
    const totalDelta = allComparisons.reduce((sum, comp) => sum + comp.delta, 0);
    const averageDivergence = allComparisons.length > 0 ? totalDelta / allComparisons.length : 0;

    const criticalDifferences = allComparisons.filter(c => c.status === 'critico').length;
    const alertDifferences = allComparisons.filter(c => c.status === 'alerta').length;

    // Calculate top SKUs with differences
    const skuDifferences = new Map<string, { totalDifferences: number; totalDelta: number }>();
    
    allComparisons.forEach(comp => {
      if (comp.status !== 'ok') {
        const existing = skuDifferences.get(comp.skuId) || { totalDifferences: 0, totalDelta: 0 };
        skuDifferences.set(comp.skuId, {
          totalDifferences: existing.totalDifferences + 1,
          totalDelta: existing.totalDelta + comp.delta,
        });
      }
    });

    // Get SKU names and create top SKUs list
    const topSkusWithDifferences = await Promise.all(
      Array.from(skuDifferences.entries())
        .sort((a, b) => b[1].totalDifferences - a[1].totalDifferences)
        .slice(0, 10)
        .map(async ([skuId, data]) => {
          const sku = await skuRepo.findById(skuId);
          return {
            skuId,
            skuName: sku?.name,
            totalDifferences: data.totalDifferences,
            averageDelta: data.totalDelta / data.totalDifferences,
          };
        })
    );

    return {
      totalPallets,
      lowConfidencePallets,
      lowConfidencePercentage,
      averageDivergence,
      criticalDifferences,
      alertDifferences,
      topSkusWithDifferences,
    };
  }
}

export class ListDifferencesTask {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(
    filters: {
      status?: 'ok' | 'alerta' | 'critico';
      contractId?: string;
      startDate?: Date;
      endDate?: Date;
      skuId?: string;
    } = {},
    limit: number = 50,
    startAfter?: string
  ): Promise<DifferenceListItem[]> {
    const comparisonRepo = this.repositoryFactory.getComparisonRepository();
    const palletRepo = this.repositoryFactory.getPalletRepository();
    const skuRepo = this.repositoryFactory.getSkuRepository();

    // Get comparisons based on filters
    let comparisons: Comparison[] = [];

    if (filters.status) {
      comparisons = await comparisonRepo.findByStatus(filters.status);
    } else if (filters.startDate || filters.endDate) {
      comparisons = await comparisonRepo.findByDateRange(
        filters.startDate || new Date(0),
        filters.endDate || new Date()
      );
    } else {
      comparisons = await comparisonRepo.list(limit, startAfter);
    }

    // Apply additional filters
    if (filters.skuId) {
      comparisons = comparisons.filter(c => c.skuId === filters.skuId);
    }

    // Filter by contract if specified
    if (filters.contractId) {
      const contractPallets = await palletRepo.findByContract(filters.contractId);
      const contractPalletIds = new Set(contractPallets.map(p => p.id));
      comparisons = comparisons.filter(c => contractPalletIds.has(c.palletId));
    }

    // Limit results
    comparisons = comparisons.slice(0, limit);

    // Enrich with pallet and SKU information
    const differences: DifferenceListItem[] = await Promise.all(
      comparisons.map(async (comparison) => {
        const pallet = await palletRepo.findById(comparison.palletId);
        const sku = await skuRepo.findById(comparison.skuId);

        return {
          id: comparison.id,
          palletId: comparison.palletId,
          palletQr: pallet?.qr,
          skuId: comparison.skuId,
          skuName: sku?.name,
          origemQtd: comparison.origemQtd,
          destinoQtd: comparison.destinoQtd,
          delta: comparison.delta,
          status: comparison.status,
          motivo: comparison.motivo,
          createdAt: comparison.createdAt,
        };
      })
    );

    return differences;
  }
}

export class ExportDifferencesCsvTask {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(
    filters: {
      status?: 'ok' | 'alerta' | 'critico';
      contractId?: string;
      startDate?: Date;
      endDate?: Date;
      skuId?: string;
    } = {},
    userId: string
  ): Promise<string> {
    // Get all differences matching the filters
    const listTask = new ListDifferencesTask(this.repositoryFactory);
    const differences = await listTask.execute(filters, 10000); // Large limit for export

    // TODO: Implement Cloud Function call for CSV generation
    // For now, return a placeholder URL
    const csvUrl = `https://storage.googleapis.com/your-bucket/exports/differences-${Date.now()}.csv`;

    // Create audit log
    await this.createAuditLog('differences_csv_exported', 'export', csvUrl, userId, {
      filterCount: Object.keys(filters).length,
      recordCount: differences.length,
      filters,
    });

    return csvUrl;
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

export class AuditTrailTask {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(
    filters: {
      entityType?: string;
      entityId?: string;
      userId?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    limit: number = 100,
    startAfter?: string
  ) {
    const auditRepo = this.repositoryFactory.getAuditLogRepository();

    let auditLogs = [];

    if (filters.entityType && filters.entityId) {
      auditLogs = await auditRepo.findByEntity(filters.entityType, filters.entityId);
    } else if (filters.userId) {
      auditLogs = await auditRepo.findByUser(filters.userId);
    } else if (filters.action) {
      auditLogs = await auditRepo.findByAction(filters.action);
    } else if (filters.startDate || filters.endDate) {
      auditLogs = await auditRepo.findByDateRange(
        filters.startDate || new Date(0),
        filters.endDate || new Date()
      );
    } else {
      auditLogs = await auditRepo.list(limit, startAfter);
    }

    return auditLogs.slice(0, limit);
  }
}
