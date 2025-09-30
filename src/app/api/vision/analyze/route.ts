import { NextRequest } from 'next/server';
import { createApiResponse, createErrorResponse } from '../../../../lib/api-utils';
import { supabaseAdmin } from '../../../../lib/supabase';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

interface VisionResponse {
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
    bounding_boxes_detected?: number;
    contours_detected?: number;
    estimated_item_volume_mm3: number | null;
    estimated_pallet_volume_mm3: number | null;
    detection_notes: string | null;
  };
}

async function convertFileToBase64(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    throw new Error(`Failed to convert file to base64: ${error}`);
  }
}

function cleanJsonResponse(content: string): string {
  // Check if response is an apology or refusal
  if (content.toLowerCase().includes("i'm sorry") || 
      content.toLowerCase().includes("i cannot") ||
      content.toLowerCase().includes("i'm unable")) {
    throw new Error("GPT refused to analyze the images: " + content.substring(0, 100));
  }
  
  // Remove markdown code blocks
  let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // Remove any text before the first { and after the last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  // If no JSON found, throw error
  if (!cleaned.startsWith('{')) {
    throw new Error("No valid JSON found in response: " + content.substring(0, 100));
  }
  
  return cleaned;
}

async function uploadImageToSupabase(file: File, fileName: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from('pallet-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('pallet-images')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

async function analyzeWithGPTVision(
  images: { front?: string; side?: string; top?: string },
  metadata?: VisionMetadata
): Promise<VisionResponse> {
  const systemPrompt = `
Você é um especialista em visão computacional para pallets industriais.
Sua tarefa é contar os itens visíveis nas imagens **com máxima precisão possível**, 
usando múltiplas técnicas de análise em paralelo.

CONTEXTO: Você está analisando itens organizados em um pallet industrial. Estes itens podem ser caixas, produtos, containers ou qualquer mercadoria empilhada de forma organizada.

=== METODOLOGIA OBRIGATÓRIA ===

1. MÉTODO DE BOUNDING BOX (estilo YOLO):
- Imagine retângulos em volta de cada item visível no pallet.
- Conte quantos bounding boxes distintos existem.
- Evite sobreposição ou contagem duplicada.

2. MÉTODO DE SEGMENTAÇÃO DE CONTORNO (estilo Mask R-CNN):
- Considere que alguns itens podem estar encostados no pallet.
- Detecte contornos individuais, mesmo quando grudados.
- Cada forma fechada = 1 item.

3. MÉTODO DE GRADE (linhas × colunas) - CRÍTICO:
- CONTE LINHAS VERTICAIS: Observe quantos "andares" ou "níveis" estão empilhados (tipicamente 4-6).
- CONTE COLUNAS HORIZONTAIS: Observe quantos itens existem lado a lado em cada linha (tipicamente 15-20).
- Use bordas, sombras, separações e mudanças de textura para identificar cada item individual.
- DICA: Se você vê um padrão regular, conte item por item em uma linha completa, depois conte quantas linhas existem.
- VALIDAÇÃO: Se contar 18 itens em uma linha e 5 linhas = 18×5 = 90 itens total.
- NÃO subestime: Pallets industriais frequentemente têm 80-120 itens.
- Calcule total = linhas × colunas.

4. VALIDAÇÃO CRUZADA:
- Compare os três métodos.
- Se os resultados forem diferentes, escolha o valor que for mais consistente com o padrão regular de pallets industriais (normalmente 80-120 itens).
- Explique no campo "rationale" como resolveu a divergência.

=== FORMATO DE RESPOSTA (somente JSON válido) ===
{
  "item_count": <número total>,
  "confidence": <0.0-1.0>,
  "item_count_by_layer": [
    {"layer_index": <número>, "rows": <número>, "columns": <número>, "count": <número>}
  ],
  "assumptions": {
    "item_dimensions_mm": {"width": null, "height": null, "depth": null},
    "pallet_dimensions_mm": {"width": null, "height": null, "depth": null},
    "missing_views": [],
    "other": ["contagem baseada em bounding boxes + contorno + grade"]
  },
  "rationale": "Explique os resultados dos três métodos e como chegou ao número final.",
  "suggestions": ["Adicionar vista superior para validação final"],
  "debug": {
    "grid_detected": true,
    "rows_detected": <número>,
    "columns_detected": <número>,
    "bounding_boxes_detected": <número>,
    "contours_detected": <número>,
    "detection_notes": "Comparação feita entre os três métodos"
  }
}

=== EXEMPLO REAL ===
{
  "item_count": 90,
  "confidence": 0.97,
  "item_count_by_layer": [
    {"layer_index": 1, "rows": 5, "columns": 18, "count": 90}
  ],
  "assumptions": {
    "item_dimensions_mm": {"width": null, "height": null, "depth": null},
    "pallet_dimensions_mm": {"width": null, "height": null, "depth": null},
    "missing_views": ["top"],
    "other": ["validação por bounding boxes (92), contornos (90) e grade (5x18=90). Resultado final = 90."]
  },
  "rationale": "Análise detalhada: Bounding boxes detectaram 92 itens, contornos detectaram 90 itens, e análise de grade identificou claramente 5 linhas verticais × 18 colunas horizontais = 90 itens. O padrão de grade é consistente e regular.",
  "suggestions": ["Foto superior ajudaria a confirmar"],
  "debug": {
    "grid_detected": true,
    "rows_detected": 5,
    "columns_detected": 18,
    "bounding_boxes_detected": 92,
    "contours_detected": 90,
    "detection_notes": "Grade regular de 5×18 detectada com alta precisão. Padrão industrial típico confirmado."
  }
}`;

  const messages: any[] = [
    {
      role: "system",
      content: systemPrompt
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Analise este PALLET INDUSTRIAL e conte todos os itens/produtos/caixas organizados nele usando os TRÊS MÉTODOS em paralelo:

1. BOUNDING BOX: Imagine retângulos em volta de cada item visível
2. CONTORNOS: Detecte formas individuais, mesmo quando encostadas  
3. GRADE: Conte linhas × colunas se organizados regularmente

COMPARE os três resultados e escolha o mais consistente com pallets industriais (80-120 itens típicos).

${metadata?.contract_name ? `Contrato: ${metadata.contract_name}` : ''}
${metadata?.item_types_count ? `Tipos de produtos: ${metadata.item_types_count}` : ''}

${metadata?.skus && metadata.skus.length > 0 ? `
Produtos esperados no pallet:
${metadata.skus.map(sku => 
  `• ${sku.code} - ${sku.name}${sku.dimensions ? ` (${sku.dimensions})` : ''}`
).join('\n')}
` : ''}

DICA IMPORTANTE: Este pallet tem padrão industrial típico com aproximadamente 15-20 colunas horizontais e 4-6 linhas verticais.

EXEMPLO DE VALIDAÇÃO CRUZADA:
- Bounding boxes: ~92 itens
- Contornos: ~90 itens  
- Grade: 5 linhas × 18 colunas = 90 itens
- RESULTADO FINAL: 90 (grade regular detectada)

ATENÇÃO: Conte cuidadosamente as separações sutis entre itens para identificar o padrão real de linhas e colunas.

Retorne JSON com os três métodos aplicados e a validação cruzada.`
        }
      ]
    }
  ];

  // Add images to the message with specific instructions
  const availableViews = [];
  if (images.front) {
    messages[1].content.push({
      type: "text",
      text: "🔍 VISTA FRONTAL - Analise para contar CAMADAS VERTICAIS (quantos andares empilhados):"
    });
    messages[1].content.push({
      type: "image_url",
      image_url: { url: images.front }
    });
    availableViews.push("front");
  }
  if (images.side) {
    messages[1].content.push({
      type: "text",
      text: "🔍 VISTA LATERAL - Analise para contar ITENS HORIZONTAIS (quantos itens por camada):"
    });
    messages[1].content.push({
      type: "image_url", 
      image_url: { url: images.side }
    });
    availableViews.push("side");
  }
  if (images.top) {
    messages[1].content.push({
      type: "text",
      text: "🔍 VISTA SUPERIOR - Use para VALIDAR a contagem horizontal:"
    });
    messages[1].content.push({
      type: "image_url",
      image_url: { url: images.top }
    });
    availableViews.push("top");
  }

  try {
    // Log detailed analysis information
    console.log('\n🔍 === ANÁLISE DE VISÃO COMPUTACIONAL ===');
    console.log('📊 Metadados recebidos:');
    console.log(`   • Contrato: ${metadata?.contract_name || 'Não informado'}`);
    console.log(`   • Tipos de produtos: ${metadata?.item_types_count || 0}`);
    
    if (metadata?.skus && metadata.skus.length > 0) {
      console.log('📦 Produtos esperados:');
      metadata.skus.forEach((sku, index) => {
        console.log(`   ${index + 1}. ${sku.code} - ${sku.name}${sku.dimensions ? ` (${sku.dimensions})` : ''}`);
      });
    }

    console.log('\n📸 Imagens para análise:');
    const imageMessages = messages[1].content.filter((item: any) => item.type === 'image_url');
    imageMessages.forEach((img: any, index: number) => {
      const imageType = img.image_url.url.includes('front') ? 'Frontal' : 
                       img.image_url.url.includes('side') ? 'Lateral' : 
                       img.image_url.url.includes('top') ? 'Superior' : `Imagem ${index + 1}`;
      
      const isBase64 = img.image_url.url.startsWith('data:');
      const isSupabaseUrl = img.image_url.url.includes('supabase');
      
      if (isBase64) {
        const sizeKB = Math.round(img.image_url.url.length * 0.75 / 1024);
        console.log(`   • ${imageType}: ~${sizeKB}KB (base64 - fallback)`);
      } else if (isSupabaseUrl) {
        console.log(`   • ${imageType}: URL pública Supabase (otimizado)`);
      } else {
        console.log(`   • ${imageType}: URL externa`);
      }
    });

    console.log('\n🤖 Enviando para GPT-4o...');
    console.log(`   • Modelo: gpt-4o`);
    console.log(`   • Temperatura: 0.0`);
    console.log(`   • Max tokens: 2000`);
    console.log('=== AGUARDANDO RESPOSTA ===\n');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 2000,
      temperature: 0.0
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from GPT Vision");
    }

    console.log('✅ === RESPOSTA RECEBIDA ===');
    console.log(`📝 Tamanho da resposta: ${content.length} caracteres`);
    
    // Clean and parse JSON response
    const cleanedContent = cleanJsonResponse(content);
    console.log('🧹 Limpeza de markdown aplicada');
    
    if (content !== cleanedContent) {
      console.log('⚠️  Markdown removido da resposta');
    }
    
    const result = JSON.parse(cleanedContent) as VisionResponse;
    
    // Validate required fields
    if (typeof result.item_count !== 'number' || 
        typeof result.confidence !== 'number' ||
        !result.assumptions ||
        !result.rationale ||
        !Array.isArray(result.suggestions)) {
      throw new Error("Invalid response format from GPT Vision");
    }

    // Force minimum item count if GPT returns 0 but we have valid images
    const hasValidImages = Object.values(images).some(img => img !== undefined);
    if (result.item_count === 0 && hasValidImages) {
      console.warn('GPT returned 0 items but images are present. Forcing minimum estimate.');
      result.item_count = 1;
      result.confidence = Math.max(0.1, result.confidence);
      result.rationale = "Estimativa mínima aplicada - " + result.rationale;
      result.suggestions.push("Melhorar qualidade das imagens para contagem mais precisa");
    }

    // Ensure confidence is between 0 and 1
    result.confidence = Math.max(0, Math.min(1, result.confidence));
    
    // Truncate rationale if too long
    if (result.rationale.length > 300) {
      result.rationale = result.rationale.substring(0, 297) + "...";
    }

    // Log final analysis results
    console.log('🎯 === RESULTADO DA ANÁLISE ===');
    console.log(`📊 Itens contados: ${result.item_count}`);
    console.log(`🎯 Confiança: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`💭 Justificativa: ${result.rationale}`);
    
    if (result.item_count_by_layer && result.item_count_by_layer.length > 0) {
      console.log('📚 Contagem por camadas:');
      result.item_count_by_layer.forEach(layer => {
        const gridInfo = layer.rows && layer.columns ? ` (${layer.rows} linhas x ${layer.columns} colunas)` : '';
        console.log(`   • Camada ${layer.layer_index}: ${layer.count} itens${gridInfo}`);
      });
    }
    
    if (result.debug?.grid_detected) {
      console.log('🔲 Grade detectada:');
      if (result.debug.rows_detected) console.log(`   • Linhas: ${result.debug.rows_detected}`);
      if (result.debug.columns_detected) console.log(`   • Colunas: ${result.debug.columns_detected}`);
    }
    
    if (result.debug?.bounding_boxes_detected || result.debug?.contours_detected) {
      console.log('🔍 Métodos de detecção:');
      if (result.debug.bounding_boxes_detected) console.log(`   • Bounding boxes: ${result.debug.bounding_boxes_detected}`);
      if (result.debug.contours_detected) console.log(`   • Contornos: ${result.debug.contours_detected}`);
      if (result.debug.rows_detected && result.debug.columns_detected) {
        console.log(`   • Grade: ${result.debug.rows_detected}×${result.debug.columns_detected} = ${result.debug.rows_detected * result.debug.columns_detected}`);
      }
    }
    
    if (result.suggestions && result.suggestions.length > 0) {
      console.log('💡 Sugestões:');
      result.suggestions.forEach((suggestion, index) => {
        console.log(`   ${index + 1}. ${suggestion}`);
      });
    }
    
    console.log('=== ANÁLISE CONCLUÍDA ===\n');

    return result;

  } catch (error) {
    console.log('❌ === ERRO NA ANÁLISE ===');
    console.log(`🚨 Tipo do erro: ${error instanceof SyntaxError ? 'JSON Parse Error' : 'Erro Geral'}`);
    console.log(`📝 Mensagem: ${error}`);
    
    // Retry with temperature 0.0 if JSON parsing failed
    if (error instanceof SyntaxError) {
      console.log('🔄 Tentando novamente com GPT-4o...');
      try {
        const retryResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          max_tokens: 2000,
          temperature: 0.0
        });

        const retryContent = retryResponse.choices[0]?.message?.content;
        if (retryContent) {
          console.log('✅ Retry bem-sucedido!');
          const cleanedRetryContent = cleanJsonResponse(retryContent);
          const retryResult = JSON.parse(cleanedRetryContent) as VisionResponse;
          
          console.log('🎯 === RESULTADO DO RETRY ===');
          console.log(`📊 Itens contados: ${retryResult.item_count}`);
          console.log(`🎯 Confiança: ${(retryResult.confidence * 100).toFixed(1)}%`);
          console.log('=== RETRY CONCLUÍDO ===\n');
          
          return retryResult;
        }
      } catch (retryError) {
        console.log('❌ Retry também falhou:', retryError);
      }
    }

    console.log('=== ANÁLISE FALHOU ===\n');
    throw new Error(`GPT Vision analysis failed: ${error}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('\n🚀 === NOVA SOLICITAÇÃO DE ANÁLISE ===');
    const formData = await request.formData();
    
    const frontImage = formData.get('front_image') as File | null;
    const sideImage = formData.get('side_image') as File | null;
    const topImage = formData.get('top_image') as File | null;
    const metadataString = formData.get('metadata') as string | null;

    console.log('📁 Arquivos recebidos:');
    console.log(`   • Frontal: ${frontImage ? `${frontImage.name} (${Math.round(frontImage.size / 1024)}KB)` : 'Não fornecida'}`);
    console.log(`   • Lateral: ${sideImage ? `${sideImage.name} (${Math.round(sideImage.size / 1024)}KB)` : 'Não fornecida'}`);
    console.log(`   • Superior: ${topImage ? `${topImage.name} (${Math.round(topImage.size / 1024)}KB)` : 'Não fornecida'}`);

    // Validate at least one image is provided
    if (!frontImage && !sideImage && !topImage) {
      return createErrorResponse('At least one image is required', 400);
    }
    // Parse metadata if provided
    let metadata: VisionMetadata | undefined;
    if (metadataString) {
      try {
        metadata = JSON.parse(metadataString);
        console.log('📋 Metadados parseados com sucesso');
      } catch (error) {
        console.log('❌ Erro ao parsear metadados:', error);
        return createErrorResponse('Invalid metadata JSON', 400);
      }
    }

    // Upload images to Supabase and use public URLs for GPT Vision
    console.log('🔄 Processando e enviando imagens para Supabase...');
    const imageUrls: { front?: string; side?: string; top?: string } = {};
    const timestamp = Date.now();

    if (frontImage) {
      try {
        const fileName = `vision/${timestamp}_front_${frontImage.name}`;
        const publicUrl = await uploadImageToSupabase(frontImage, fileName);
        imageUrls.front = publicUrl;
        console.log('✅ Imagem frontal enviada para Supabase');
      } catch (uploadError) {
        console.log('❌ Falha no upload frontal, usando base64 como fallback');
        imageUrls.front = await convertFileToBase64(frontImage);
      }
    }

    if (sideImage) {
      try {
        const fileName = `vision/${timestamp}_side_${sideImage.name}`;
        const publicUrl = await uploadImageToSupabase(sideImage, fileName);
        imageUrls.side = publicUrl;
        console.log('✅ Imagem lateral enviada para Supabase');
      } catch (uploadError) {
        console.log('❌ Falha no upload lateral, usando base64 como fallback');
        imageUrls.side = await convertFileToBase64(sideImage);
      }
    }

    if (topImage) {
      try {
        const fileName = `vision/${timestamp}_top_${topImage.name}`;
        const publicUrl = await uploadImageToSupabase(topImage, fileName);
        imageUrls.top = publicUrl;
        console.log('✅ Imagem superior enviada para Supabase');
      } catch (uploadError) {
        console.log('❌ Falha no upload superior, usando base64 como fallback');
        imageUrls.top = await convertFileToBase64(topImage);
      }
    }

    // Analyze with GPT Vision
    console.log('✅ Imagens processadas, iniciando análise...');
    const analysis = await analyzeWithGPTVision(imageUrls, metadata);

    // Log final success
    console.log('🎉 === ANÁLISE FINALIZADA COM SUCESSO ===');
    console.log(`📊 Total de itens: ${analysis.item_count}`);
    console.log(`🎯 Confiança final: ${(analysis.confidence * 100).toFixed(1)}%`);
    console.log('=== RETORNANDO RESULTADO ===\n');

    return createApiResponse(analysis);

  } catch (error) {
    console.log('💥 === ERRO CRÍTICO NA API ===');
    console.log(`🚨 Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    console.log(`📍 Stack: ${error instanceof Error ? error.stack : 'N/A'}`);
    console.log('=== RETORNANDO ERRO ===\n');
    
    const message = error instanceof Error ? error.message : 'Vision analysis failed';
    const isRetryable = !message.includes('Invalid') && !message.includes('required');
    
    return new Response(JSON.stringify({ error: message, retryable: isRetryable }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
