import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { db } from '../../../../lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ Limpando banco de dados...');
    
    // Desabilitar foreign keys temporariamente
    db.pragma('foreign_keys = OFF');
    
    // Limpar todas as tabelas na ordem correta (respeitando foreign keys)
    const tables = [
      'audit_logs',
      'comparisons', 
      'receipts',
      'manifest_pallets',
      'manifests',
      'pallet_items',
      'pallet_photos',
      'pallets',
      'qr_tags',
      'skus',
      'locations',
      'contracts'
    ];
    
    for (const table of tables) {
      db.prepare(`DELETE FROM ${table}`).run();
      console.log(`✅ Tabela ${table} limpa`);
    }
    
    // Reabilitar foreign keys
    db.pragma('foreign_keys = ON');
    
    console.log('🎉 Banco de dados limpo com sucesso!');
    
    return createApiResponse({
      message: 'Database reset successfully',
      tablesCleared: tables.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reset database';
    console.error('❌ Erro ao limpar banco:', error);
    return createErrorResponse(message, 500);
  }
}
