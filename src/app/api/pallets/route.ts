import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse, MVP_USER_ID } from '../../../lib/api-utils';
import { RepositoryFactory } from '../../../lib/repositories';
import { PalletCreateSchema, PalletCreateWithDetailsSchema } from '../../../lib/models';

const palletRepository = RepositoryFactory.getPalletRepository();
const qrTagRepository = RepositoryFactory.getQrTagRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Raw request body:', body);
    
    // Check if this is a detailed creation (has selected_skus, photos, or vision_metadata)
    const isDetailedCreation = (body.selected_skus && body.selected_skus.length > 0) || 
                              (body.photos && body.photos.length > 0) || 
                              body.vision_metadata;
    console.log('isDetailedCreation:', isDetailedCreation, {
      has_selected_skus: !!body.selected_skus,
      selected_skus_length: body.selected_skus?.length || 0,
      has_photos: !!body.photos,
      photos_length: body.photos?.length || 0,
      has_vision_metadata: !!body.vision_metadata
    });
    
    if (isDetailedCreation) {
      // Use enhanced creation schema
      const validatedData = PalletCreateWithDetailsSchema.parse(body);
      console.log('Validated detailed data:', {
        ...validatedData,
        photos: validatedData.photos?.map(p => ({
          photo_type: p.photo_type,
          stage: p.stage,
          file_path_length: p.file_path.length,
          is_base64: p.file_path.startsWith('data:image/')
        })),
        vision_metadata: validatedData.vision_metadata ? {
          item_count: validatedData.vision_metadata.item_count,
          confidence: validatedData.vision_metadata.confidence,
          has_rationale: !!validatedData.vision_metadata.rationale
        } : null
      });
      
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
      
      // Create pallet with all details
      const result = await palletRepository.createWithDetails(validatedData, MVP_USER_ID);
      
      // Link the QR tag to the pallet
      await qrTagRepository.linkToPallet(qrTag.id, result.pallet.id);
      
      // If vision metadata is provided, save vision analysis
      if (validatedData.vision_metadata) {
        console.log('Saving vision analysis for pallet:', result.pallet.id);
        try {
          const visionAnalysisData = {
            pallet_id: result.pallet.id,
            item_count: validatedData.vision_metadata.item_count || 0,
            confidence: validatedData.vision_metadata.confidence || 0,
            item_count_by_layer: validatedData.vision_metadata.item_count_by_layer || undefined,
            rationale: validatedData.vision_metadata.rationale || undefined,
            suggestions: validatedData.vision_metadata.suggestions || undefined,
            debug: validatedData.vision_metadata.debug || undefined
          };
          
          await palletRepository.saveVisionAnalysis(visionAnalysisData);
          console.log('✅ Vision analysis saved successfully');
          
          // Update pallet with vision data
          await palletRepository.update(result.pallet.id, {
            estimated_item_count: visionAnalysisData.item_count,
            vision_confidence: visionAnalysisData.confidence
          });
          console.log('✅ Pallet updated with vision data');
          
        } catch (visionError) {
          console.error('❌ Error saving vision analysis:', visionError);
          // Don't fail the entire request, just log the error
        }
      }
      
      return createApiResponse(result, 201);
    } else {
      // Use simple creation schema
      const validatedData = PalletCreateSchema.parse(body);
      console.log('Validated simple data:', validatedData);
      
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
      
      const pallet = await palletRepository.create(palletData);
      
      // Link the QR tag to the pallet
      await qrTagRepository.linkToPallet(qrTag.id, pallet.id);
      
      return createApiResponse(pallet, 201);
    }
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const palletId = searchParams.get('id');
    
    if (!palletId) {
      return createErrorResponse('Pallet ID is required', 400);
    }
    
    // Check if pallet exists
    const pallet = await palletRepository.findById(palletId);
    if (!pallet) {
      return createErrorResponse('Pallet not found', 404);
    }
    
    // Check if pallet can be deleted (only active pallets can be deleted)
    if (pallet.status !== 'ativo') {
      return createErrorResponse('Cannot delete pallet that is not in active status', 400);
    }
    
    // Unlink QR tag before deleting pallet
    if (pallet.qr_tag_id) {
      await qrTagRepository.unlinkFromPallet(pallet.qr_tag_id);
    }
    
    // Delete the pallet
    await palletRepository.delete(palletId);
    
    return createApiResponse({ message: 'Pallet deleted successfully' });
  } catch (error) {
    console.error('Error deleting pallet:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete pallet';
    return createErrorResponse(message, 500);
  }
}
