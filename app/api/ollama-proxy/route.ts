import { NextRequest, NextResponse } from 'next/server'

/**
 * Ollama Proxy Route
 * Provides CORS-safe proxy access to Ollama API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint') || '/api/tags'
    
    // Get Ollama configuration from environment or defaults
    const ollamaHost = process.env['NEXT_PUBLIC_OLLAMA_HOST'] || 'localhost'
    const ollamaPort = process.env['NEXT_PUBLIC_OLLAMA_PORT'] || '11434'
    const ollamaProtocol = process.env['NEXT_PUBLIC_OLLAMA_PROTOCOL'] || 'http'
    
    const ollamaUrl = `${ollamaProtocol}://${ollamaHost}:${ollamaPort}${endpoint}`
    
    console.log('🔗 Proxying request to Ollama:', ollamaUrl)
    
    const response = await fetch(ollamaUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      console.error('❌ Ollama proxy failed:', response.status, response.statusText)
      return NextResponse.json(
        { error: `Ollama service unavailable: ${response.status} ${response.statusText}` },
        { status: 503 }
      )
    }
    
    const data = await response.json()
    console.log('✅ Ollama proxy successful')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Ollama proxy error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to connect to Ollama service',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint') || '/api/generate'
    
    const ollamaHost = process.env['NEXT_PUBLIC_OLLAMA_HOST'] || 'localhost'
    const ollamaPort = process.env['NEXT_PUBLIC_OLLAMA_PORT'] || '11434'
    const ollamaProtocol = process.env['NEXT_PUBLIC_OLLAMA_PROTOCOL'] || 'http'
    
    const ollamaUrl = `${ollamaProtocol}://${ollamaHost}:${ollamaPort}${endpoint}`
    
    const body = await request.json()
    
    console.log('🔗 Proxying POST request to Ollama:', ollamaUrl)
    
    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      console.error('❌ Ollama proxy POST failed:', response.status, response.statusText)
      return NextResponse.json(
        { error: `Ollama service unavailable: ${response.status} ${response.statusText}` },
        { status: 503 }
      )
    }
    
    const data = await response.json()
    console.log('✅ Ollama proxy POST successful')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Ollama proxy POST error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to connect to Ollama service',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}
