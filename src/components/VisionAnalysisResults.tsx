import React from 'react';
import { 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Lightbulb,
  Package,
  Layers,
  Ruler,
  RefreshCw
} from 'lucide-react';

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

interface VisionAnalysisResultsProps {
  result: VisionAnalysisResult;
  onAccept: (itemCount: number) => void;
  onReject: () => void;
  onRetry?: () => void;
}

export function VisionAnalysisResults({ result, onAccept, onReject, onRetry }: VisionAnalysisResultsProps) {
  const confidenceColor = result.confidence >= 0.8 
    ? 'text-green-400' 
    : result.confidence >= 0.6 
    ? 'text-yellow-400' 
    : 'text-red-400';

  const confidenceIcon = result.confidence >= 0.8 
    ? CheckCircle 
    : result.confidence >= 0.6 
    ? AlertTriangle 
    : AlertTriangle;

  const ConfidenceIcon = confidenceIcon;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Eye className="h-5 w-5 text-purple-400" />
          Análise de Visão Computacional
        </h3>
        <div className={`flex items-center gap-2 ${confidenceColor}`}>
          <ConfidenceIcon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {(result.confidence * 100).toFixed(0)}% confiança
          </span>
        </div>
      </div>

      {/* Main Result */}
      <div className="bg-slate-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-400" />
            <span className="text-white font-medium">Contagem Estimada</span>
          </div>
          <span className="text-2xl font-bold text-white">{result.item_count} itens</span>
        </div>
        <p className="text-slate-300 text-sm">{result.rationale}</p>
      </div>

      {/* Layer Breakdown */}
      {result.item_count_by_layer && result.item_count_by_layer.length > 0 && (
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-blue-400" />
            <span className="text-white font-medium">Contagem por Camada</span>
          </div>
          <div className="space-y-2">
            {result.item_count_by_layer.map((layer) => (
              <div key={layer.layer_index} className="bg-slate-600/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Camada {layer.layer_index}</span>
                  <span className="text-lg font-bold text-white">{layer.count} itens</span>
                </div>
                {layer.rows && layer.columns && (
                  <div className="flex items-center gap-4 text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded"></div>
                      {layer.rows} linhas
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded"></div>
                      {layer.columns} colunas
                    </span>
                    <span className="text-slate-400">
                      ({layer.rows} × {layer.columns} = {layer.count})
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid Detection Info */}
      {result.debug?.grid_detected && (
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-green-400" />
            <span className="text-white font-medium">Padrão de Grade Detectado</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {result.debug.rows_detected && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded"></div>
                <span className="text-slate-300">Linhas detectadas: {result.debug.rows_detected}</span>
              </div>
            )}
            {result.debug.columns_detected && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded"></div>
                <span className="text-slate-300">Colunas detectadas: {result.debug.columns_detected}</span>
              </div>
            )}
          </div>
          <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded">
            <p className="text-green-300 text-xs">
              ✓ Padrão regular detectado - alta confiança na contagem
            </p>
          </div>
        </div>
      )}

      {/* Assumptions */}
      <div className="bg-slate-700/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-blue-400" />
          <span className="text-white font-medium">Suposições da Análise</span>
        </div>
        <div className="space-y-2 text-sm">
          {result.assumptions.item_dimensions_mm.width && (
            <div className="flex items-center gap-2">
              <Ruler className="h-3 w-3 text-slate-400" />
              <span className="text-slate-300">
                Dimensões do item: {result.assumptions.item_dimensions_mm.width} × {result.assumptions.item_dimensions_mm.height} × {result.assumptions.item_dimensions_mm.depth} mm
              </span>
            </div>
          )}
          {result.assumptions.pallet_dimensions_mm.width && (
            <div className="flex items-center gap-2">
              <Ruler className="h-3 w-3 text-slate-400" />
              <span className="text-slate-300">
                Dimensões do pallet: {result.assumptions.pallet_dimensions_mm.width} × {result.assumptions.pallet_dimensions_mm.height} × {result.assumptions.pallet_dimensions_mm.depth} mm
              </span>
            </div>
          )}
          {result.assumptions.missing_views.length > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-yellow-400" />
              <span className="text-slate-300">
                Vistas faltantes: {result.assumptions.missing_views.join(', ')}
              </span>
            </div>
          )}
          {result.assumptions.other.map((assumption, index) => (
            <div key={index} className="flex items-center gap-2">
              <Info className="h-3 w-3 text-slate-400" />
              <span className="text-slate-300">{assumption}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-yellow-400" />
            <span className="text-white font-medium">Sugestões para Melhorar Precisão</span>
          </div>
          <ul className="space-y-1 text-sm">
            {result.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">•</span>
                <span className="text-slate-300">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Debug Info */}
      {result.debug.detection_notes && (
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-slate-400" />
            <span className="text-white font-medium">Informações Técnicas</span>
          </div>
          <p className="text-slate-300 text-sm">{result.debug.detection_notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={onReject}
          className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors flex items-center justify-center gap-2"
        >
          Rejeitar e Inserir Manualmente
        </button>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Processar Novamente
          </button>
        )}
        
        <button
          onClick={() => onAccept(result.item_count)}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-lg hover:from-purple-600 hover:to-pink-500 transition-all duration-200 flex items-center justify-center gap-2"
        >
          Aceitar Contagem ({result.item_count} itens)
        </button>
      </div>
    </div>
  );
}
