# Environment Variables Setup

Para o sistema de visão computacional funcionar, adicione as seguintes variáveis ao seu arquivo `.env.local`:

```bash
# OpenAI API Key for GPT-4 Vision
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (if not already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Setup Steps:

1. **OpenAI API Key**: 
   - Acesse https://platform.openai.com/api-keys
   - Crie uma nova API key
   - Adicione ao `.env.local` como `OPENAI_API_KEY`

2. **Supabase Storage**:
   - Execute o script `supabase-storage-setup.sql` no Supabase SQL Editor
   - Isso criará o bucket `pallet-images` e as políticas necessárias

3. **Restart do servidor**:
   - Após adicionar as variáveis, reinicie o servidor Next.js
   - `npm run dev` ou `yarn dev`

## Teste da API:

```bash
curl -X POST http://localhost:3000/api/vision/analyze \
  -F "front_image=@/path/to/front.jpg" \
  -F "side_image=@/path/to/side.jpg" \
  -F "metadata={\"item_name\":\"Caixa\",\"item_dimensions_mm\":{\"width\":300,\"height\":200,\"depth\":400}}"
```
