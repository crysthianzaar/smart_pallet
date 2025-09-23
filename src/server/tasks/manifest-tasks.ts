import { Manifest, ManifestCreate, ManifestPallet } from '../models';
import { IRepositoryFactory } from '../repo/interfaces';

export class CreateManifestTask {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(data: ManifestCreate, userId: string): Promise<Manifest> {
    // Validate contract and locations exist
    const contractRepo = this.repositoryFactory.getContractRepository();
    const locationRepo = this.repositoryFactory.getLocationRepository();
    
    const contract = await contractRepo.findById(data.contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    const originLocation = await locationRepo.findById(data.originLocationId);
    if (!originLocation) {
      throw new Error('Origin location not found');
    }

    const destinationLocation = await locationRepo.findById(data.destinationLocationId);
    if (!destinationLocation) {
      throw new Error('Destination location not found');
    }

    // Generate manifest code
    const manifestRepo = this.repositoryFactory.getManifestRepository();
    const code = await manifestRepo.generateCode();

    // Create manifest
    const manifest = await manifestRepo.create({
      ...data,
      code,
      status: 'rascunho',
      loadedBy: null,
      loadedAt: null,
      pdfUrl: null,
    });

    // Create audit log
    await this.createAuditLog('manifest_created', 'manifest', manifest.id, userId, {
      contractId: data.contractId,
      originLocationId: data.originLocationId,
      destinationLocationId: data.destinationLocationId,
    });

    return manifest;
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

export class AddPalletToManifestTask {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(manifestId: string, palletId: string, userId: string): Promise<ManifestPallet> {
    const manifestRepo = this.repositoryFactory.getManifestRepository();
    const palletRepo = this.repositoryFactory.getPalletRepository();
    const manifestPalletRepo = this.repositoryFactory.getManifestPalletRepository();

    // Validate manifest exists and is in draft status
    const manifest = await manifestRepo.findById(manifestId);
    if (!manifest) {
      throw new Error('Manifest not found');
    }

    if (manifest.status !== 'rascunho') {
      throw new Error('Cannot add pallets to loaded manifest');
    }

    // Validate pallet exists and is sealed
    const pallet = await palletRepo.findById(palletId);
    if (!pallet) {
      throw new Error('Pallet not found');
    }

    if (pallet.status !== 'selado') {
      throw new Error('Only sealed pallets can be added to manifest');
    }

    // Check if pallet is already in another manifest
    const existingManifestPallet = await manifestPalletRepo.findByPallet(palletId);
    if (existingManifestPallet) {
      throw new Error('Pallet is already in another manifest');
    }

    // Validate contract and location match
    if (pallet.contractOriginId !== manifest.contractId) {
      throw new Error('Pallet contract does not match manifest contract');
    }

    if (pallet.locationOriginId !== manifest.originLocationId) {
      throw new Error('Pallet origin location does not match manifest origin location');
    }

    // Add pallet to manifest
    const manifestPallet = await manifestPalletRepo.create({
      manifestId,
      palletId,
      addedBy: userId,
      addedAt: new Date(),
    });

    // Create audit log
    await this.createAuditLog('pallet_added_to_manifest', 'manifest', manifestId, userId, {
      palletId,
      palletQr: pallet.qr,
    });

    return manifestPallet;
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

export class MarkManifestLoadedTask {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(manifestId: string, userId: string): Promise<Manifest> {
    const manifestRepo = this.repositoryFactory.getManifestRepository();
    const manifestPalletRepo = this.repositoryFactory.getManifestPalletRepository();
    const palletRepo = this.repositoryFactory.getPalletRepository();

    // Validate manifest exists and is in draft status
    const manifest = await manifestRepo.findById(manifestId);
    if (!manifest) {
      throw new Error('Manifest not found');
    }

    if (manifest.status !== 'rascunho') {
      throw new Error('Manifest is already loaded');
    }

    // Check if manifest has pallets
    const manifestPallets = await manifestPalletRepo.findByManifest(manifestId);
    if (manifestPallets.length === 0) {
      throw new Error('Cannot load manifest without pallets');
    }

    // Update manifest status
    const loadedManifest = await manifestRepo.update(manifestId, {
      status: 'carregado',
      loadedBy: userId,
      loadedAt: new Date(),
    });

    // Update all pallets status to 'em_transporte'
    for (const manifestPallet of manifestPallets) {
      await palletRepo.update(manifestPallet.palletId, {
        status: 'em_transporte',
      });
    }

    // Create audit log
    await this.createAuditLog('manifest_loaded', 'manifest', manifestId, userId, {
      palletCount: manifestPallets.length,
    });

    return loadedManifest;
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

export class ExportManifestPdfTask {
  constructor(private repositoryFactory: IRepositoryFactory) {}

  async execute(manifestId: string, userId: string): Promise<string> {
    const manifestRepo = this.repositoryFactory.getManifestRepository();

    // Validate manifest exists
    const manifest = await manifestRepo.findById(manifestId);
    if (!manifest) {
      throw new Error('Manifest not found');
    }

    // TODO: Implement Cloud Function call for PDF generation
    // For now, return a placeholder URL
    const pdfUrl = `https://storage.googleapis.com/your-bucket/manifests/${manifestId}/pdf/${Date.now()}.pdf`;
    
    // Update manifest with PDF URL
    await manifestRepo.update(manifestId, { pdfUrl });

    // Create audit log
    await this.createAuditLog('manifest_pdf_exported', 'manifest', manifestId, userId, {
      pdfUrl,
    });

    return pdfUrl;
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
