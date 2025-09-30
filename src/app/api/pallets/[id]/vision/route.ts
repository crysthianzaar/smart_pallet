import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../../lib/api-utils';
import { RepositoryFactory } from '../../../../../lib/repositories';
import { VisionAnalysisCreateSchema } from '../../../../../lib/models';

const palletRepository = RepositoryFactory.getPalletRepository();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate vision analysis data
    const validatedData = VisionAnalysisCreateSchema.parse({
      ...body,
      pallet_id: id
    });
    
    // Check if pallet exists
    const pallet = await palletRepository.findById(id);
    if (!pallet) {
      return createErrorResponse('Pallet not found', 404);
    }
    
    // Save vision analysis
    const visionAnalysis = await palletRepository.saveVisionAnalysis(validatedData);
    
    // Update pallet with vision analysis summary
    const updateData = {
      estimated_item_count: validatedData.item_count,
      vision_confidence: validatedData.confidence,
      ai_confidence: Math.round(validatedData.confidence * 100),
      requires_manual_review: validatedData.confidence < 0.65
    };
    
    await palletRepository.update(id, updateData);
    
    return createApiResponse(visionAnalysis, 201);
  } catch (error) {
    console.error('Error saving vision analysis:', error);
    const message = error instanceof Error ? error.message : 'Failed to save vision analysis';
    return createErrorResponse(message, 400);
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Check if pallet exists
    const pallet = await palletRepository.findById(id);
    if (!pallet) {
      return createErrorResponse('Pallet not found', 404);
    }
    
    // Get vision analysis
    const visionAnalysis = await palletRepository.getVisionAnalysis(id);
    
    if (!visionAnalysis) {
      return createErrorResponse('Vision analysis not found', 404);
    }
    
    return createApiResponse(visionAnalysis);
  } catch (error) {
    console.error('Error getting vision analysis:', error);
    const message = error instanceof Error ? error.message : 'Failed to get vision analysis';
    return createErrorResponse(message, 500);
  }
}
