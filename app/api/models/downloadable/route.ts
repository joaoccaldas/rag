import { NextRequest, NextResponse } from 'next/server'

interface ModelInfo {
  name: string
  displayName: string
  description: string
  size: string
  category: string
  recommended: boolean
  installed: boolean
}

const POPULAR_MODELS: Omit<ModelInfo, 'installed'>[] = [
  {
    name: 'gpt-oss:20b',
    displayName: 'GPT-OSS 20B',
    description: 'High-performance 20B parameter model with excellent reasoning and analysis capabilities',
    size: '13GB',
    category: 'Premium',
    recommended: true
  },
  {
    name: 'llama3.2:latest',
    displayName: 'Llama 3.2',
    description: 'Meta\'s latest Llama model with improved reasoning and code generation',
    size: '2.0GB',
    category: 'General',
    recommended: true
  },
  {
    name: 'llama3.1:latest', 
    displayName: 'Llama 3.1',
    description: 'Meta\'s powerful language model with excellent performance',
    size: '4.7GB',
    category: 'General',
    recommended: true
  },
  {
    name: 'mistral:latest',
    displayName: 'Mistral 7B',
    description: 'Efficient and powerful 7B parameter model from Mistral AI',
    size: '4.1GB',
    category: 'General',
    recommended: true
  },
  {
    name: 'codellama:latest',
    displayName: 'Code Llama',
    description: 'Specialized for code generation and programming tasks',
    size: '3.8GB',
    category: 'Code',
    recommended: false
  },
  {
    name: 'phi3:latest',
    displayName: 'Phi-3',
    description: 'Microsoft\'s small but capable language model',
    size: '2.3GB',
    category: 'Efficient',
    recommended: true
  },
  {
    name: 'qwen2:latest',
    displayName: 'Qwen2',
    description: 'Alibaba\'s multilingual model with strong performance',
    size: '4.4GB',
    category: 'General',
    recommended: false
  },
  {
    name: 'gemma:latest',
    displayName: 'Gemma',
    description: 'Google\'s open model family',
    size: '5.0GB',
    category: 'General',
    recommended: true
  },
  {
    name: 'nomic-embed-text:latest',
    displayName: 'Nomic Embed Text',
    description: 'Specialized embedding model for vector search and semantic similarity',
    size: '274MB',
    category: 'Embedding',
    recommended: true
  }
]

async function getInstalledModels(): Promise<string[]> {
  try {
    const response = await fetch('http://localhost:11434/api/tags')
    if (response.ok) {
      const data = await response.json()
      return data.models?.map((m: { name: string }) => m.name) || []
    }
  } catch (error) {
    console.warn('Failed to fetch installed models:', error)
  }
  return []
}

export async function GET() {
  try {
    const installedModels = await getInstalledModels()
    const modelsWithStatus = POPULAR_MODELS.map(model => ({
      ...model,
      installed: installedModels.includes(model.name)
    }))

    return NextResponse.json({
      success: true,
      models: modelsWithStatus
    })
  } catch (error) {
    console.error('Error fetching downloadable models:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, modelName } = await request.json()

    if (!action || !modelName) {
      return NextResponse.json(
        { success: false, error: 'Action and model name are required' },
        { status: 400 }
      )
    }

    let message = ''
    
    if (action === 'install') {
      const installResponse = await fetch('http://localhost:11434/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: false }),
      })

      if (!installResponse.ok) {
        throw new Error(`Failed to install model: ${installResponse.statusText}`)
      }

      message = `Successfully started installation of ${modelName}`
    } else if (action === 'delete') {
      const deleteResponse = await fetch('http://localhost:11434/api/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      })

      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete model: ${deleteResponse.statusText}`)
      }

      message = `Successfully deleted ${modelName}`
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, message, modelName })
  } catch (error) {
    console.error('Error in model management:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process model action' },
      { status: 500 }
    )
  }
}
