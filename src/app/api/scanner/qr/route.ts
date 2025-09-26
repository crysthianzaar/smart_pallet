import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../lib/repositories';

const qrTagRepository = RepositoryFactory.getQrTagRepository();
const palletRepository = RepositoryFactory.getPalletRepository();

interface ScanResponse {
  success: boolean;
  message: string;
  data: unknown;
  pallet?: unknown;
  action?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCode } = body;
    
    if (!qrCode) {
      return createErrorResponse('QR code is required', 400);
    }
    
    const qrTag = await qrTagRepository.findByQrCode(qrCode);
    if (!qrTag) {
      return createErrorResponse('QR code not found', 404);
    }
    
    const response: ScanResponse = { 
      success: true, 
      message: 'QR code scanned successfully', 
      data: qrTag,
      action: 'create_new' // Default action
    };
    
    if (qrTag.status === 'vinculado' && qrTag.current_pallet_id) {
      // QR is linked to a pallet, get pallet details
      const pallet = await palletRepository.findById(qrTag.current_pallet_id);
      if (pallet) {
        response.pallet = pallet;
        
        // Determine action based on pallet status
        switch (pallet.status) {
          case 'ativo':
            response.action = 'continue_editing';
            break;
          case 'em_manifesto':
            response.action = 'load_to_manifest';
            break;
          case 'em_transito':
            response.action = 'receive_pallet';
            break;
          case 'recebido':
            response.action = 'view_completed';
            break;
          case 'finalizado':
            response.action = 'view_completed';
            break;
          default:
            response.action = 'view_pallet';
        }
      }
    } else {
      // QR is free, can create new pallet
      response.action = 'create_new';
    }
    
    return createApiResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to scan QR code';
    return createErrorResponse(message, 500);
  }
}
