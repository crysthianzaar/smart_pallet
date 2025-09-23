import { RepositoryFactory } from './repositories';

export async function seedDatabase() {
  const contractRepo = RepositoryFactory.getContractRepository();
  const locationRepo = RepositoryFactory.getLocationRepository();
  const skuRepo = RepositoryFactory.getSkuRepository();
  const qrTagRepo = RepositoryFactory.getQrTagRepository();

  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // Verificar se já existem dados
    const existingContracts = await contractRepo.count();
    if (existingContracts > 0) {
      console.log('⚠️ Dados já existem no banco. Pulando seed...');
      return {
        contracts: existingContracts,
        locations: await locationRepo.count(),
        skus: await skuRepo.count(),
        qrTags: await qrTagRepo.count(),
        message: 'Dados já existiam no banco'
      };
    }

    // Criar contratos
    const contract1 = await contractRepo.create({
      name: 'Contrato ABC Logística',
      company: 'ABC Transportes Ltda',
      contact_email: 'contato@abctransportes.com',
      contact_phone: '(11) 99999-9999',
      status: 'active'
    });

    const contract2 = await contractRepo.create({
      name: 'Contrato XYZ Distribuição',
      company: 'XYZ Distribuição S.A.',
      contact_email: 'comercial@xyzdist.com',
      contact_phone: '(21) 88888-8888',
      status: 'active'
    });

    console.log('✅ Contratos criados');

    // Criar locais
    await locationRepo.create({
      name: 'Centro de Distribuição São Paulo',
      type: 'origem',
      address: 'Rua das Indústrias, 1000',
      city: 'São Paulo',
      state: 'SP',
      postal_code: '01234-567',
      contract_id: contract1.id,
      status: 'active'
    });

    await locationRepo.create({
      name: 'Loja Shopping Center',
      type: 'destino',
      address: 'Av. Paulista, 2000',
      city: 'São Paulo',
      state: 'SP',
      postal_code: '01310-100',
      contract_id: contract1.id,
      status: 'active'
    });

    await locationRepo.create({
      name: 'Depósito Rio de Janeiro',
      type: 'origem',
      address: 'Rua do Porto, 500',
      city: 'Rio de Janeiro',
      state: 'RJ',
      postal_code: '20000-000',
      contract_id: contract2.id,
      status: 'active'
    });

    await locationRepo.create({
      name: 'Filial Copacabana',
      type: 'destino',
      address: 'Av. Copacabana, 1500',
      city: 'Rio de Janeiro',
      state: 'RJ',
      postal_code: '22070-011',
      contract_id: contract2.id,
      status: 'active'
    });

    console.log('✅ Locais criados');

    // Criar SKUs
    const skus = [
      {
        code: 'PROD001',
        name: 'Smartphone Galaxy S23',
        description: 'Smartphone Samsung Galaxy S23 128GB',
        unit: 'un',
        weight: 0.168,
        category: 'Eletrônicos',
        status: 'active' as const
      },
      {
        code: 'PROD002',
        name: 'Notebook Dell Inspiron',
        description: 'Notebook Dell Inspiron 15 3000',
        unit: 'un',
        weight: 1.83,
        category: 'Eletrônicos',
        status: 'active' as const
      },
      {
        code: 'PROD003',
        name: 'Fone de Ouvido JBL',
        description: 'Fone de Ouvido JBL Tune 510BT',
        unit: 'un',
        weight: 0.16,
        category: 'Acessórios',
        status: 'active' as const
      },
      {
        code: 'PROD004',
        name: 'Carregador USB-C',
        description: 'Carregador USB-C 65W',
        unit: 'un',
        weight: 0.2,
        category: 'Acessórios',
        status: 'active' as const
      },
      {
        code: 'PROD005',
        name: 'Tablet iPad Air',
        description: 'Tablet Apple iPad Air 64GB',
        unit: 'un',
        weight: 0.458,
        category: 'Eletrônicos',
        status: 'active' as const
      }
    ];

    for (const sku of skus) {
      await skuRepo.create(sku);
    }

    console.log('✅ SKUs criados');

    // Criar QR Tags
    const qrTags = [];
    for (let i = 1; i <= 50; i++) {
      const qrCode = `QR${i.toString().padStart(6, '0')}`;
      qrTags.push({
        qr_code: qrCode,
        status: 'livre' as const
      });
    }

    for (const qrTag of qrTags) {
      await qrTagRepo.create(qrTag);
    }

    console.log('✅ QR Tags criadas');

    console.log('🎉 Seed do banco de dados concluído com sucesso!');
    
    return {
      contracts: 2,
      locations: 4,
      skus: 5,
      qrTags: 50
    };

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
}
