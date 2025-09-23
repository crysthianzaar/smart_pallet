import { IRepositoryFactory } from '../repo/interfaces';
import {
  KpiDashboardTask,
  ListDifferencesTask,
  ExportDifferencesCsvTask,
  AuditTrailTask,
} from '../tasks/dashboard-tasks';

export class GetKpisUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(startDate?: Date, endDate?: Date, contractId?: string) {
    const task = new KpiDashboardTask(this.repositoryFactory);
    return await task.execute(startDate, endDate, contractId);
  }
}

export class ListDiffsUC {
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
  ) {
    const task = new ListDifferencesTask(this.repositoryFactory);
    return await task.execute(filters, limit, startAfter);
  }
}

export class ExportDiffsCsvUC {
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
  ) {
    const task = new ExportDifferencesCsvTask(this.repositoryFactory);
    return await task.execute(filters, userId);
  }
}

export class AuditTrailUC {
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
    const task = new AuditTrailTask(this.repositoryFactory);
    return await task.execute(filters, limit, startAfter);
  }
}
