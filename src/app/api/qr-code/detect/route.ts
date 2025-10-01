import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Iniciando detecção de QR code...')
    
    const body = await request.json()
    const { image } = body
    
    if (!image) {
      return NextResponse.json(
        { error: 'Imagem é obrigatória' },
        { status: 400 }
      )
    }

    console.log('📸 Processando imagem para detecção de QR code...')

    // Enhanced prompt for QR code detection
    const systemPrompt = `Você é um especialista em detecção e leitura de códigos QR em imagens.

TAREFA: Detectar e extrair o texto/conteúdo de códigos QR presentes na imagem.

INSTRUÇÕES:
1. Procure por códigos QR na imagem fornecida
2. Se encontrar um ou mais códigos QR, extraia o conteúdo/texto de cada um
3. Retorne o resultado em formato JSON válido
4. Se não encontrar nenhum QR code, indique claramente

FORMATO DE RESPOSTA (JSON):
{
  "qr_detected": true/false,
  "qr_code": "conteúdo_do_qr_code",
  "confidence": 0.0-1.0,
  "notes": "observações sobre a detecção"
}

REGRAS:
- Se múltiplos QR codes, retorne o mais claro/legível
- Seja preciso na extração do conteúdo
- Indique o nível de confiança na leitura
- Se a imagem estiver borrada ou QR ilegível, indique baixa confiança`

    const userMessage = `Analise esta imagem e detecte qualquer código QR presente. Extraia o conteúdo do QR code se encontrado.

IMPORTANTE: Retorne apenas o JSON de resposta, sem texto adicional.`

    const messages: any[] = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: [
          { type: "text", text: userMessage },
          {
            type: "image_url",
            image_url: { url: image }
          }
        ]
      }
    ]

    console.log('🤖 Enviando para GPT-4o para detecção de QR...')

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 500,
      temperature: 0.0
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('Resposta vazia do modelo de IA')
    }

    console.log('📝 Resposta bruta do GPT:', content)

    // Parse JSON response
    let detectionResult
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        detectionResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('JSON não encontrado na resposta')
      }
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta:', parseError)
      
      // Fallback: try to extract QR content from text
      const qrMatch = content.match(/QR[^:]*:?\s*([A-Za-z0-9\-_]+)/i) || 
                     content.match(/código[^:]*:?\s*([A-Za-z0-9\-_]+)/i) ||
                     content.match(/([A-Za-z0-9]{8,})/i)
      
      detectionResult = {
        qr_detected: !!qrMatch,
        qr_code: qrMatch ? qrMatch[1] : null,
        confidence: qrMatch ? 0.7 : 0.0,
        notes: 'Detecção por fallback de parsing'
      }
    }

    console.log('✅ Detecção de QR concluída:')
    console.log(`   • QR detectado: ${detectionResult.qr_detected}`)
    console.log(`   • Conteúdo: ${detectionResult.qr_code || 'N/A'}`)
    console.log(`   • Confiança: ${(detectionResult.confidence * 100).toFixed(1)}%`)

    return NextResponse.json(detectionResult)

  } catch (error) {
    console.error('❌ Erro na detecção de QR:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro interno na detecção de QR',
        qr_detected: false,
        qr_code: null,
        confidence: 0.0
      },
      { status: 500 }
    )
  }
}
