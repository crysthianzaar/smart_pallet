import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// Generate Manifest PDF
export const generateManifestPdf = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { manifestId } = data;

  if (!manifestId) {
    throw new functions.https.HttpsError('invalid-argument', 'manifestId is required');
  }

  try {
    // Get manifest data
    const manifestSnapshot = await db.collection('manifests').doc(manifestId).get();
    const manifest = manifestSnapshot.data();
  
    if (!manifest) {
      throw new functions.https.HttpsError('not-found', 'Manifest not found');
    }

    // Get manifest pallets
    const manifestPalletsSnapshot = await db.collection('manifestPallets')
      .where('manifestId', '==', manifestId)
      .get();

    const manifestPallets = manifestPalletsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{id: string, palletId: string}>;

    const pallets = [];
    for (const manifestPallet of manifestPallets) {
      const palletDoc = await db.collection('pallets').doc(manifestPallet.palletId).get();
      if (palletDoc.exists) {
        const pallet = palletDoc.data();
        
        if (!pallet) {
          continue; // Skip this pallet if data is undefined
        }
        
        // Get pallet items
        const itemsSnapshot = await db.collection('palletItems')
          .where('palletId', '==', manifestPallet.palletId)
          .get();
        
        const items = [];
        for (const itemDoc of itemsSnapshot.docs) {
          const item = itemDoc.data();
          const skuDoc = await db.collection('skus').doc(item.skuId).get();
          items.push({
            ...item,
            sku: skuDoc.exists ? skuDoc.data() : null,
          });
        }
        
        pallets.push({
          ...pallet,
          id: palletDoc.id,
          items,
        });
      }
    }

    // Get contract and locations
    const contractDoc = await db.collection('contracts').doc(manifest.contractId).get();
    const originLocationDoc = await db.collection('locations').doc(manifest.originLocationId).get();
    const destinationLocationDoc = await db.collection('locations').doc(manifest.destinationLocationId).get();

    // Prepare template data
    const templateData = {
      manifest: {
        ...manifest,
        id: manifestId,
      },
      contract: contractDoc.exists ? contractDoc.data() : null,
      originLocation: originLocationDoc.exists ? originLocationDoc.data() : null,
      destinationLocation: destinationLocationDoc.exists ? destinationLocationDoc.data() : null,
      pallets,
      generatedAt: new Date().toLocaleString('pt-BR'),
    };

    // HTML template for the manifest
    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Manifesto {{manifest.code}}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info-section { margin-bottom: 20px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .pallets-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .pallets-table th, .pallets-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .pallets-table th { background-color: #f2f2f2; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>MANIFESTO DE TRANSPORTE</h1>
            <h2>{{manifest.code}}</h2>
        </div>
        
        <div class="info-section">
            <div class="info-row">
                <strong>Contrato:</strong> {{contract.name}} ({{contract.code}})
            </div>
            <div class="info-row">
                <strong>Origem:</strong> {{originLocation.name}} - {{originLocation.address}}
            </div>
            <div class="info-row">
                <strong>Destino:</strong> {{destinationLocation.name}} - {{destinationLocation.address}}
            </div>
            <div class="info-row">
                <strong>Status:</strong> {{manifest.status}}
            </div>
            {{#if manifest.loadedAt}}
            <div class="info-row">
                <strong>Carregado em:</strong> {{manifest.loadedAt}}
            </div>
            {{/if}}
        </div>

        <table class="pallets-table">
            <thead>
                <tr>
                    <th>QR Code</th>
                    <th>Status</th>
                    <th>SKUs</th>
                    <th>Quantidades</th>
                </tr>
            </thead>
            <tbody>
                {{#each pallets}}
                <tr>
                    <td>{{this.qr}}</td>
                    <td>{{this.status}}</td>
                    <td>
                        {{#each this.items}}
                        {{this.sku.name}}<br>
                        {{/each}}
                    </td>
                    <td>
                        {{#each this.items}}
                        {{#if this.qtdAjustada}}{{this.qtdAjustada}}{{else}}{{this.qtdIa}}{{/if}} {{this.sku.unit}}<br>
                        {{/each}}
                    </td>
                </tr>
                {{/each}}
            </tbody>
        </table>

        <div class="footer">
            <p>Gerado em: {{generatedAt}}</p>
            <p>SmartPallet - Sistema de Gestão de Paletes</p>
        </div>
    </body>
    </html>
    `;

    // Compile template
    const template = Handlebars.compile(htmlTemplate);
    const html = template(templateData);

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setContent(html);
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });
    
    await browser.close();

    // Upload PDF to Storage
    const fileName = `manifest-${manifestId}-${Date.now()}.pdf`;
    const filePath = `manifests/${manifestId}/pdf/${fileName}`;
    
    const bucket = storage.bucket();
    const file = bucket.file(filePath);
    
    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
      },
    });

    // Make file publicly readable
    await file.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // Update manifest with PDF URL
    await db.collection('manifests').doc(manifestId).update({
      pdfUrl: publicUrl,
    });

    return { pdfUrl: publicUrl };
  } catch (error) {
    console.error('Error generating manifest PDF:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate PDF');
  }
});

// Export Differences CSV
export const generateDashboardReport = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { filters = {} } = data;

  try {
    // Get comparisons based on filters
    let query = db.collection('comparisons') as any;

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters.startDate) {
      query = query.where('createdAt', '>=', new Date(filters.startDate));
    }

    if (filters.endDate) {
      query = query.where('createdAt', '<=', new Date(filters.endDate));
    }

    const comparisonsSnapshot = await query.orderBy('createdAt', 'desc').limit(10000).get();

    // Enrich data with pallet and SKU information
    const csvData = [];
    for (const doc of comparisonsSnapshot.docs) {
      const comparison = doc.data();
      
      // Get pallet info
      const palletDoc = await db.collection('pallets').doc(comparison.palletId).get();
      const pallet = palletDoc.exists ? palletDoc.data() : null;
      
      // Get SKU info
      const skuDoc = await db.collection('skus').doc(comparison.skuId).get();
      const sku = skuDoc.exists ? skuDoc.data() : null;

      // Filter by contract if specified
      if (filters.contractId && pallet && pallet.contractOriginId !== filters.contractId) {
        continue;
      }

      // Filter by SKU if specified
      if (filters.skuId && comparison.skuId !== filters.skuId) {
        continue;
      }

      csvData.push({
        id: doc.id,
        palletQr: pallet?.qr || '',
        skuCode: sku?.code || '',
        skuName: sku?.name || '',
        origemQtd: comparison.origemQtd,
        destinoQtd: comparison.destinoQtd,
        delta: comparison.delta,
        status: comparison.status,
        motivo: comparison.motivo || '',
        createdAt: comparison.createdAt?.toDate?.()?.toISOString() || '',
      });
    }

    // Create a CSV file
    const comparisons = comparisonsSnapshot.docs.map((doc: any) => ({ 
      id: doc.id, 
      ...doc.data() as any 
    }));
    
    // Create a map of SKUs for reference
    const skuMap: Record<string, { name: string, code: string }> = {};
    for (const comparison of comparisons) {
      if (comparison.skuId && !skuMap[comparison.skuId]) {
        const skuDoc = await db.collection('skus').doc(comparison.skuId).get();
        const sku = skuDoc.data();
        if (sku) {
          skuMap[comparison.skuId] = { 
            name: sku.name || 'Unknown', 
            code: sku.code || 'N/A' 
          };
        }
      }
    }
    
    const csvRows = comparisons.map((comparison: any) => ({
      palletId: comparison.palletId,
      sku: skuMap[comparison.skuId]?.name || 'Unknown SKU',
      skuCode: skuMap[comparison.skuId]?.code || 'N/A',
      expectedCount: comparison.origemQtd,
      actualCount: comparison.destinoQtd,
      difference: comparison.delta,
      status: comparison.status,
      reason: comparison.motivo || 'N/A',
      date: comparison.createdAt.toISOString().split('T')[0]
    }));

    const fileName = `comparison-report-${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = `reports/${fileName}`;
    const tempFilePath = `/tmp/${fileName}`;

    // Write to temp file using createObjectCsvWriter
    const createCsvWriter = require('csv-writer');
    const csvWriter = createCsvWriter.createObjectCsvWriter({
      path: tempFilePath,
      header: [
        {id: 'palletId', title: 'PalletID'},
        {id: 'sku', title: 'SKU'},
        {id: 'skuCode', title: 'SKU Code'},
        {id: 'expectedCount', title: 'Expected Count'},
        {id: 'actualCount', title: 'Actual Count'},
        {id: 'difference', title: 'Difference'},
        {id: 'status', title: 'Status'},
        {id: 'reason', title: 'Reason'},
        {id: 'date', title: 'Date'}
      ]
    });
    
    await csvWriter.writeRecords(csvRows);

    // Upload CSV to Storage
    const bucket = storage.bucket();
    const file = bucket.file(filePath);
    
    // Import fs module
    const fs = require('fs');
    
    await file.save(fs.readFileSync(tempFilePath), {
      metadata: {
        contentType: 'text/csv',
      },
    });

    // Make file publicly readable
    await file.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return { csvUrl: publicUrl, recordCount: csvData.length };
  } catch (error) {
    console.error('Error exporting differences CSV:', error);
    throw new functions.https.HttpsError('internal', 'Failed to export CSV');
  }
});

// AI Stub for count suggestion (placeholder for real AI integration)
export const generateReceiptPdf = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { palletId } = data;

  if (!palletId) {
    throw new functions.https.HttpsError('invalid-argument', 'palletId is required');
  }

  try {
    // TODO: Replace with real AI integration
    // This is a stub implementation that simulates AI confidence based on photos
    
    const palletDoc = await db.collection('pallets').doc(palletId).get();
    if (!palletDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Pallet not found');
    }

    const pallet = palletDoc.data();
    
    if (!pallet) {
      throw new functions.https.HttpsError('not-found', 'Pallet data not found');
    }
    
    // Get pallet items
    const itemsSnapshot = await db.collection('palletItems')
      .where('palletId', '==', palletId)
      .get();

    // Simulate AI confidence calculation
    const hasPhotos = pallet.photos && pallet.photos.length >= 3;
    const baseConfidence = hasPhotos ? 0.8 : 0.4;
    const randomVariation = (Math.random() - 0.5) * 0.3; // ±15%
    const confGlobal = Math.max(0.1, Math.min(0.95, baseConfidence + randomVariation));

    // Simulate item-level confidence and quantities
    const updatedItems = [];
    for (const doc of itemsSnapshot.docs) {
      const item = doc.data();
      const itemConfidence = confGlobal + (Math.random() - 0.5) * 0.2;
      const qtdIa = Math.floor(Math.random() * 50) + 1; // Random quantity 1-50
      
      await db.collection('palletItems').doc(doc.id).update({
        qtdIa,
        confMedia: Math.max(0.1, Math.min(0.95, itemConfidence)),
      });
      
      updatedItems.push({
        id: doc.id,
        ...item,
        qtdIa,
        confMedia: Math.max(0.1, Math.min(0.95, itemConfidence)),
      });
    }

    // Update pallet with global confidence
    await db.collection('pallets').doc(palletId).update({ confGlobal });

    return { confGlobal, items: updatedItems };
  } catch (error) {
    console.error('Error in AI count suggestion:', error);
    throw new functions.https.HttpsError('internal', 'Failed to suggest counts');
  }
});
