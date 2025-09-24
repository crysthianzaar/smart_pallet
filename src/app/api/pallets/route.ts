import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, MVP_USER_ID } from '../../../lib/api-utils';
import { RepositoryFactory } from '../../../lib/repositories';
import { PalletCreateSchema } from '../../../lib/models';

const palletRepository = RepositoryFactory.getPalletRepository();
const qrTagRepository = RepositoryFactory.getQrTagRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Raw request body:', body);
    
    const validatedData = PalletCreateSchema.parse(body);
    console.log('Validated data:', validatedData);
    
    // Check if QR tag exists and is available
    const qrTag = await qrTagRepository.findById(validatedData.qr_tag_id);
    if (!qrTag) {
      return createErrorResponse('QR tag not found', 404);
    }
    
    if (qrTag.status === 'vinculado') {
      // If already linked, return the existing pallet
      const existingPallet = await palletRepository.findByQrTag(qrTag.id);
      if (existingPallet) {
        return createApiResponse(existingPallet);
      }
    }
    
    // Create the pallet
    const palletData = {
      ...validatedData,
      created_by: MVP_USER_ID,
    };
    
    console.log('Final pallet data before create:', palletData);
    console.log('Data types:', Object.entries(palletData).map(([key, value]) => [key, typeof value, value]));
    
    const pallet = await palletRepository.create(palletData);
    
    // Link the QR tag to the pallet
    await qrTagRepository.linkToPallet(qrTag.id, pallet.id);
    
    return createApiResponse(pallet, 201);
  } catch (error) {
    console.error('Detailed error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create pallet';
    return createErrorResponse(message, 400);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const contractId = searchParams.get('contractId');
    const requiresManualReview = searchParams.get('requiresManualReview') === 'true';
    const withDetails = searchParams.get('withDetails') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let pallets;
    if (status) {
      // O método findByStatus já retorna detalhes completos
      pallets = await palletRepository.findByStatus(status);
    } else if (contractId) {
      // Aqui precisaríamos implementar um método específico
      pallets = await palletRepository.findByContract(contractId);
    } else if (requiresManualReview) {
      // O método findRequiringManualReview já retorna detalhes completos
      pallets = await palletRepository.findRequiringManualReview();
    } else if (withDetails) {
      // Usar o novo método que retorna detalhes completos
      pallets = await palletRepository.findAllWithDetails(limit, offset);
    } else {
      // Padrão - sem detalhes adicionais
      pallets = await palletRepository.findAll(limit, offset);
    }
    
    return createApiResponse(pallets);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list pallets';
    return createErrorResponse(message, 400);
  }
}
