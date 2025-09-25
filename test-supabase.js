// Teste rápido da conexão com Supabase
// Execute com: node test-supabase.js

const { createClient } = require('@supabase/supabase-js')

// Substitua pelos seus valores
const supabaseUrl = 'https://seu-projeto.supabase.co'
const supabaseKey = 'sua-chave-anon-aqui'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔄 Testando conexão com Supabase...')
    
    // Teste simples: buscar contratos
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .limit(5)
    
    if (error) {
      console.error('❌ Erro:', error.message)
      return
    }
    
    console.log('✅ Conexão bem-sucedida!')
    console.log('📊 Contratos encontrados:', data?.length || 0)
    
    if (data && data.length > 0) {
      console.log('📋 Primeiro contrato:', data[0])
    }
    
  } catch (err) {
    console.error('❌ Erro na conexão:', err.message)
  }
}

testConnection()
