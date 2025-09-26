import { IRepositoryFactory } from '../repo/interfaces';
import { UserCreate, ContractCreate, LocationCreate, SkuCreate } from '../models';

export class CreateUserUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(data: UserCreate, adminUserId: string) {
    const userRepo = this.repositoryFactory.getUserRepository();
    
    // Check if user already exists
    const existingUser = await userRepo.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user with temporary password (should be changed on first login)
    const user = await userRepo.create({
      email: data.email,
      name: data.name,
      role: data.role,
      password: data.password,
    });

    // Create audit log
    const auditRepo = this.repositoryFactory.getAuditLogRepository();
    await auditRepo.create({
      action: 'user_created',
      entityType: 'user',
      entityId: user.id,
      userId: adminUserId,
      details: { email: data.email, role: data.role },
      timestamp: new Date(),
    });

    return user;
  }
}

export class CreateContractUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(data: ContractCreate, userId: string) {
    const contractRepo = this.repositoryFactory.getContractRepository();
    
    // Check if contract code already exists
    const existingContract = await contractRepo.findByCode(data.code);
    if (existingContract) {
      throw new Error('Contract with this code already exists');
    }

    const contract = await contractRepo.create(data);

    // Create audit log
    const auditRepo = this.repositoryFactory.getAuditLogRepository();
    await auditRepo.create({
      action: 'contract_created',
      entityType: 'contract',
      entityId: contract.id,
      userId,
      details: { code: data.code, name: data.name },
      timestamp: new Date(),
    });

    return contract;
  }
}

export class CreateLocationUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(data: LocationCreate, userId: string) {
    const locationRepo = this.repositoryFactory.getLocationRepository();
    
    // Check if location code already exists
    const existingLocation = await locationRepo.findByCode(data.code);
    if (existingLocation) {
      throw new Error('Location with this code already exists');
    }

    const location = await locationRepo.create(data);

    // Create audit log
    const auditRepo = this.repositoryFactory.getAuditLogRepository();
    await auditRepo.create({
      action: 'location_created',
      entityType: 'location',
      entityId: location.id,
      userId,
      details: { code: data.code, name: data.name },
      timestamp: new Date(),
    });

    return location;
  }
}

export class CreateSkuUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(data: SkuCreate, userId: string) {
    const skuRepo = this.repositoryFactory.getSkuRepository();
    
    // Check if SKU code already exists
    const existingSku = await skuRepo.findByCode(data.code);
    if (existingSku) {
      throw new Error('SKU with this code already exists');
    }

    const sku = await skuRepo.create(data);

    // Create audit log
    const auditRepo = this.repositoryFactory.getAuditLogRepository();
    await auditRepo.create({
      action: 'sku_created',
      entityType: 'sku',
      entityId: sku.id,
      userId,
      details: { code: data.code, name: data.name },
      timestamp: new Date(),
    });

    return sku;
  }
}

export class ListUsersUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(role?: string, limit: number = 50, startAfter?: string) {
    const userRepo = this.repositoryFactory.getUserRepository();
    
    if (role) {
      return await userRepo.findByRole(role);
    }
    
    return await userRepo.list(limit, startAfter);
  }
}

export class ListContractsUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(activeOnly: boolean = false, limit: number = 50, startAfter?: string) {
    const contractRepo = this.repositoryFactory.getContractRepository();
    
    if (activeOnly) {
      return await contractRepo.findActive();
    }
    
    return await contractRepo.list(limit, startAfter);
  }
}

export class ListLocationsUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(activeOnly: boolean = false, limit: number = 50, startAfter?: string) {
    const locationRepo = this.repositoryFactory.getLocationRepository();
    
    if (activeOnly) {
      return await locationRepo.findActive();
    }
    
    return await locationRepo.list(limit, startAfter);
  }
}

export class ListSkusUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(activeOnly: boolean = false, limit: number = 50, startAfter?: string) {
    const skuRepo = this.repositoryFactory.getSkuRepository();
    
    if (activeOnly) {
      return await skuRepo.findActive();
    }
    
    return await skuRepo.list(limit, startAfter);
  }
}

export class UpdateContractUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(contractId: string, data: Partial<ContractCreate>, userId: string) {
    const contractRepo = this.repositoryFactory.getContractRepository();
    
    const contract = await contractRepo.findById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    const updatedContract = await contractRepo.update(contractId, data);

    // Create audit log
    const auditRepo = this.repositoryFactory.getAuditLogRepository();
    await auditRepo.create({
      action: 'contract_updated',
      entityType: 'contract',
      entityId: contractId,
      userId,
      details: { changes: data },
      timestamp: new Date(),
    });

    return updatedContract;
  }
}

export class UpdateLocationUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(locationId: string, data: Partial<LocationCreate>, userId: string) {
    const locationRepo = this.repositoryFactory.getLocationRepository();
    
    const location = await locationRepo.findById(locationId);
    if (!location) {
      throw new Error('Location not found');
    }

    const updatedLocation = await locationRepo.update(locationId, data);

    // Create audit log
    const auditRepo = this.repositoryFactory.getAuditLogRepository();
    await auditRepo.create({
      action: 'location_updated',
      entityType: 'location',
      entityId: locationId,
      userId,
      details: { changes: data },
      timestamp: new Date(),
    });

    return updatedLocation;
  }
}

export class UpdateSkuUC {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(skuId: string, data: Partial<SkuCreate>, userId: string) {
    const skuRepo = this.repositoryFactory.getSkuRepository();
    
    const sku = await skuRepo.findById(skuId);
    if (!sku) {
      throw new Error('SKU not found');
    }

    const updatedSku = await skuRepo.update(skuId, data);

    // Create audit log
    const auditRepo = this.repositoryFactory.getAuditLogRepository();
    await auditRepo.create({
      action: 'sku_updated',
      entityType: 'sku',
      entityId: skuId,
      userId,
      details: { changes: data },
      timestamp: new Date(),
    });

    return updatedSku;
  }
}
