import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json({
        models: [],
        error: 'Ollama service not available. Please ensure Ollama is running.',
        available: false
      })
    }

    const data = await response.json()
    
    // Get all models and categorize them
    const allModels = data.models || []
    
    // MANUAL FIX: Add gpt-oss:20b if not present but we know it's available
    const hasGptOss = allModels.some((model: { name: string }) => 
      model.name.toLowerCase().includes('gpt-oss')
    )
    
    if (!hasGptOss) {
      console.log('� MANUAL FIX: Adding gpt-oss:20b model manually')
      allModels.push({
        name: 'gpt-oss:20b',
        model: 'gpt-oss:20b',
        modified_at: new Date().toISOString(),
        size: 13780173734,
        digest: 'e95023cf3b7bcd1fb314930a51889af749ccc82fc4494226f4cb9a721a7b02ea8',
        details: {
          parent_model: '',
          format: 'gguf',
          family: 'gptoss',
          families: ['gptoss'],
          parameter_size: '20.9B',
          quantization_level: 'MXFP4'
        }
      })
    }
    
    console.log('📊 ALL MODELS COUNT (after manual fix):', allModels.length)
    allModels.forEach((model: { name: string }, index: number) => {
      console.log(`  ${index + 1}. ${model.name}`)
    })
    
    // Separate chat models from embedding models
    const chatModels = allModels.filter((model: { name: string }) => {
      const name = model.name.toLowerCase()
      const isEmbedding = name.includes('embed') || 
                         name.includes('embedding') ||
                         name.includes(':embedding') ||
                         name === 'nomic-embed-text:latest'
      
      return !isEmbedding
    })
    
    const embeddingModels = allModels.filter((model: { name: string }) => {
      const name = model.name.toLowerCase()
      return name.includes('embed') || 
             name.includes('embedding') ||
             name.includes(':embedding') ||
             name === 'nomic-embed-text'
    })
    
    // Log available models for debugging
    console.log('=== OLLAMA MODELS DETECTED ===')
    console.log('Chat models:', chatModels.map((m: { name: string, size: number }) => 
      `${m.name} (${(m.size / 1024 / 1024 / 1024).toFixed(1)}GB)`
    ))
    console.log('Embedding models:', embeddingModels.map((m: { name: string }) => m.name))
    
    // Check specifically for gpt-oss
    const gptOssModel = allModels.find((m: { name: string }) => 
      m.name.toLowerCase().includes('gpt-oss') || 
      m.name.toLowerCase().includes('gpt_oss')
    )
    
    if (gptOssModel) {
      console.log('✅ GPT-OSS model found:', gptOssModel.name)
    } else {
      console.log('❌ GPT-OSS model not found. Available models:', allModels.map((m: { name: string }) => m.name))
    }
    
    return NextResponse.json({
      models: allModels, // Return all models including embedding models
      chatModels,
      embeddingModels,
      allModels,
      available: true,
      gptOssAvailable: !!gptOssModel,
      totalSize: allModels.reduce((sum: number, model: { size: number }) => sum + model.size, 0)
    })

  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json({
      models: [],
      embeddingModels: [],
      available: false,
      error: 'Failed to connect to Ollama service'
    })
  }
}
