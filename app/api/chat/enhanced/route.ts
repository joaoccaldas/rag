import { NextRequest, NextResponse } from 'next/server'
import { initLlama, llamaPrompt, isLlamaInitialized } from '@/lib/llamaClient.mock'

interface EnhancedChatRequest {
  prompt: string
  useLocal?: boolean
  modelPath?: string
  settings?: {
    temperature?: number
    maxTokens?: number
    model?: string
  }
}

interface EnhancedChatResponse {
  reply: string
  source: 'local' | 'ollama'
  model?: string
  error?: string
}

/**
 * Enhanced chat API endpoint that supports both local GGUF models and Ollama
 * POST /api/chat/enhanced
 */
export async function POST(request: NextRequest) {
  try {
    const body: EnhancedChatRequest = await request.json()
    const { prompt, useLocal = false, modelPath, settings } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      )
    }

    let response: EnhancedChatResponse

    if (useLocal) {
      try {
        // Initialize local model if not already done
        if (!isLlamaInitialized()) {
          console.log('Initializing local Llama model...')
          await initLlama(modelPath)
        }

        // Generate response using local model
        const reply = await llamaPrompt(prompt)
        
        response = {
          reply,
          source: 'local',
          model: modelPath || 'local-gguf'
        }

        console.log('Response generated using local GGUF model')

      } catch (localError) {
        console.error('Local model error:', localError)
        
        // Fallback to Ollama if local model fails
        console.log('Falling back to Ollama...')
        const ollamaReply = await generateOllamaResponse(prompt, settings)
        
        response = {
          reply: ollamaReply.reply,
          source: 'ollama',
          model: ollamaReply.model,
          error: `Local model failed: ${localError instanceof Error ? localError.message : 'Unknown error'}`
        }
      }
    } else {
      // Use Ollama directly
      const ollamaReply = await generateOllamaResponse(prompt, settings)
      
      response = {
        reply: ollamaReply.reply,
        source: 'ollama',
        model: ollamaReply.model
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Enhanced chat API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate response using Ollama (existing functionality)
 */
async function generateOllamaResponse(
  prompt: string, 
  settings?: { temperature?: number; maxTokens?: number; model?: string }
): Promise<{ reply: string; model: string }> {
  try {
    const modelName = settings?.model || 'llama3.2:latest'
    
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        stream: false,
        options: {
          temperature: settings?.temperature || 0.7,
          num_predict: settings?.maxTokens || 1024,
        }
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Ollama error: ${data.error}`)
    }

    return {
      reply: data.response || 'No response received from Ollama',
      model: modelName
    }

  } catch (error) {
    console.error('Ollama request failed:', error)
    throw new Error(`Ollama connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get information about available models
 * GET /api/chat/enhanced
 */
export async function GET() {
  try {
    // Dynamically import to avoid initialization issues
    const { getLlamaInfo } = await import('@/lib/llamaClient.mock')
    const localModelInfo = getLlamaInfo ? getLlamaInfo() : { initialized: false, modelPath: null }
    
    // Check Ollama models
    let ollamaModels: string[] = []
    try {
      const ollamaResponse = await fetch('http://localhost:11434/api/tags')
      if (ollamaResponse.ok) {
        const data = await ollamaResponse.json()
        ollamaModels = data.models?.map((m: { name: string }) => m.name) || []
      }
    } catch (ollamaError) {
      console.warn('Could not fetch Ollama models:', ollamaError)
    }

    return NextResponse.json({
      local: {
        available: localModelInfo !== null,
        modelPath: localModelInfo?.modelPath || null,
        initialized: localModelInfo?.initialized || false
      },
      ollama: {
        available: ollamaModels.length > 0,
        models: ollamaModels
      },
      recommendation: ollamaModels.length > 0 ? 'ollama' : 'local'
    })

  } catch (error) {
    console.error('Error getting model info:', error)
    
    return NextResponse.json(
      { error: 'Failed to get model information' },
      { status: 500 }
    )
  }
}
