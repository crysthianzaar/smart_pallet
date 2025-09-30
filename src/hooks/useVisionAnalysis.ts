import { useState } from 'react';

interface VisionMetadata {
  item_name?: string;
  contract_name?: string;
  item_dimensions_mm?: {
    width: number;
    height: number;
    depth: number;
  } | null;
  pallet_dimensions_mm?: {
    width: number;
    height: number;
    depth: number;
  } | null;
  unit?: "mm" | "cm" | "in";
  skus?: Array<{
    code: string;
    name: string;
    description?: string;
    unit: string;
    weight?: number;
    dimensions?: string;
  }>;
  total_expected_items?: number;
  item_types_count?: number;
}

interface VisionAnalysisResult {
  item_count: number;
  confidence: number;
  item_count_by_layer?: Array<{
    layer_index: number;
    rows?: number;
    columns?: number;
    count: number;
  }>;
  assumptions: {
    item_dimensions_mm: {
      width: number | null;
      height: number | null;
      depth: number | null;
    };
    pallet_dimensions_mm: {
      width: number | null;
      height: number | null;
      depth: number | null;
    };
    missing_views: Array<"front" | "side" | "top">;
    other: string[];
  };
  rationale: string;
  suggestions: string[];
  debug: {
    grid_detected?: boolean;
    rows_detected?: number;
    columns_detected?: number;
    estimated_item_volume_mm3: number | null;
    estimated_pallet_volume_mm3: number | null;
    detection_notes: string | null;
  };
}

interface UseVisionAnalysisReturn {
  analyzeImages: (
    images: {
      front_image?: File;
      side_image?: File;
      top_image?: File;
    },
    metadata?: VisionMetadata
  ) => Promise<VisionAnalysisResult>;
  isAnalyzing: boolean;
  error: string | null;
  clearError: () => void;
}

export function useVisionAnalysis(): UseVisionAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeImages = async (
    images: {
      front_image?: File;
      side_image?: File;
      top_image?: File;
    },
    metadata?: VisionMetadata
  ): Promise<VisionAnalysisResult> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Validate at least one image is provided
      if (!images.front_image && !images.side_image && !images.top_image) {
        throw new Error('Pelo menos uma imagem é necessária para análise');
      }

      // Create FormData
      const formData = new FormData();

      if (images.front_image) {
        formData.append('front_image', images.front_image);
      }
      if (images.side_image) {
        formData.append('side_image', images.side_image);
      }
      if (images.top_image) {
        formData.append('top_image', images.top_image);
      }

      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      // Call vision analysis API
      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha na análise de visão computacional');
      }

      const result = await response.json();
      return result as VisionAnalysisResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na análise';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    analyzeImages,
    isAnalyzing,
    error,
    clearError,
  };
}
