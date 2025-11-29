// API Route: List Ollama models
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const ollamaHost = process.env.NEXT_PUBLIC_OLLAMA_HOST || 'http://localhost:11434'

    const response = await fetch(`${ollamaHost}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data = await response.json()

    // Extract model names
    const models = data.models?.map((m: any) => m.name) || []

    return NextResponse.json({
      success: true,
      models,
      count: models.length
    })
  } catch (error) {
    console.error('Error listing Ollama models:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list Ollama models',
        details: error instanceof Error ? error.message : 'Unknown error',
        models: []
      },
      { status: 500 }
    )
  }
}
