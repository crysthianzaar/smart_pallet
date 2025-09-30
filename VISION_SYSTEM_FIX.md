# Correção do Sistema de Visão Computacional

## Problema Identificado

O erro `Failed to upload image: fetch failed` ocorreu porque:

1. **Cliente Supabase Incorreto**: Estava usando o cliente normal (`supabase`) em vez do cliente admin (`supabaseAdmin`) para uploads de servidor
2. **Bucket não Configurado**: O bucket `pallet-images` pode não ter sido criado ou configurado corretamente
3. **Dependência Desnecessária**: O GPT Vision aceita base64 diretamente, não precisamos fazer upload primeiro

## Correções Implementadas

### 1. **Mudança de Estratégia**
- **Antes**: Upload para Supabase → Conversão para base64 → Envio para GPT
- **Agora**: Conversão direta para base64 → Envio para GPT (+ upload opcional para Supabase)

### 2. **Correções no Código**
```typescript
// Antes (problemático)
import { supabase } from '../../../../lib/supabase';
const { data, error } = await supabase.storage...

// Agora (corrigido)  
import { supabaseAdmin } from '../../../../lib/supabase';
const imageUrls.front = await convertFileToBase64(frontImage);
```

### 3. **Função de Conversão Direta**
```typescript
async function convertFileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = file.type || 'image/jpeg';
  return `data:${mimeType};base64,${base64}`;
}
```

### 4. **Upload Opcional para Supabase**
- Upload para Supabase agora é opcional (para armazenamento futuro)
- Falhas de upload não interrompem a análise de visão
- Logs de warning em caso de falha no upload

## Como Testar

### 1. **Verificar Variáveis de Ambiente**
```bash
# .env.local
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. **Testar API Diretamente**
```bash
curl -X POST http://localhost:3000/api/vision/analyze \
  -F "front_image=@test_front.jpg" \
  -F "side_image=@test_side.jpg" \
  -F "metadata={\"item_name\":\"Caixa de Teste\"}"
```

### 3. **Testar via Interface**
1. Acesse `/pallets/new`
2. Complete steps 1-3 (contrato, QR, fotos)
3. No step 4, clique "Iniciar Análise de Visão"
4. Verifique logs no console do navegador e servidor

## Logs de Debug Adicionados

```typescript
console.log('Vision analysis request received');
console.log('Images received:', {
  front: frontImage?.name || 'none',
  side: sideImage?.name || 'none', 
  top: topImage?.name || 'none'
});
```

## Configuração Opcional do Supabase Storage

Se quiser ativar o armazenamento das imagens:

1. **Execute no Supabase SQL Editor**:
```sql
-- Criar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('pallet-images', 'pallet-images', true);

-- Políticas de acesso
CREATE POLICY "Allow authenticated users to upload pallet images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'pallet-images');

CREATE POLICY "Allow public read access to pallet images" ON storage.objects
FOR SELECT USING (bucket_id = 'pallet-images');
```

2. **Verificar Service Role Key**: Certifique-se de que `SUPABASE_SERVICE_ROLE_KEY` está configurada

## Status Atual

✅ **Análise de visão funciona** sem dependência do Supabase Storage
✅ **Conversão direta para base64** elimina problemas de upload
✅ **Logs de debug** para facilitar troubleshooting
✅ **Upload opcional** para Supabase (não bloqueia se falhar)
✅ **Tratamento robusto de erros**

O sistema agora deve funcionar mesmo sem configuração completa do Supabase Storage.
