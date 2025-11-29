/**
 * AI ANALYSIS API ENDPOINT
 * 
 * Handles AI analysis requests for documents and visual content
 * Integrates with local Ollama instance for privacy and control
 */

import { NextRequest, NextResponse } from 'next/server'

interface AnalysisRequest {
  model: string
  prompt: string
  type: 'visual-analysis' | 'document-analysis' | 'combined-analysis'
  temperature?: number
  max_tokens?: number
}

interface OllamaResponse {
  response: string
  done: boolean
  context?: number[]
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

// Ollama API configuration with dynamic model detection
const OLLAMA_BASE_URL = process.env['OLLAMA_BASE_URL'] || 'http://localhost:11434'

// Function to get the best available model
async function getBestAvailableModel(): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`)
    if (response.ok) {
      const data = await response.json()
      const models = data.models?.map((m: { name: string }) => m.name) || []
      
      // Preferred models in order of preference
      const preferredModels = [
        'llama3.1:8b', 'llama3.1:7b', 'llama3:8b', 'llama3:7b', 
        'llama2:7b', 'mistral:7b', 'codellama:7b'
      ]
      
      // Find the best available model
      for (const preferred of preferredModels) {
        const modelBase = preferred.split(':')[0]
        const found = models.find(model => model.includes(modelBase))
        if (found) {
          console.log(`Using model: ${found}`)
          return found
        }
      }
      
      // If no preferred model found, use the first available
      if (models.length > 0) {
        console.log(`Using first available model: ${models[0]}`)
        return models[0]
      }
    }
  } catch (error) {
    console.warn('Could not detect models, using fallback')
  }
  
  // Ultimate fallback
  return 'llama3.1:8b'
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json()
    
    // Validate request
    if (!body.prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Prepare Ollama request with dynamic model detection
    const bestModel = await getBestAvailableModel()
    const ollamaRequest = {
      model: body.model || bestModel,
      prompt: body.prompt,
      stream: false,
      options: {
        temperature: body.temperature || 0.3,
        num_predict: body.max_tokens || 4000,
        top_p: 0.9,
        top_k: 40,
        repeat_penalty: 1.1
      }
    }

    // Add system prompt based on analysis type
    const systemPrompt = getSystemPrompt(body.type)
    if (systemPrompt) {
      ollamaRequest.prompt = `${systemPrompt}\n\n${body.prompt}`
    }

    console.log(`🔍 Processing ${body.type} request with model: ${ollamaRequest.model}`)

    // Call Ollama API
    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ollamaRequest)
    })

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text()
      console.error('Ollama API error:', errorText)
      return NextResponse.json(
        { error: 'AI service unavailable', details: errorText },
        { status: 503 }
      )
    }

    const result: OllamaResponse = await ollamaResponse.json()
    
    console.log(`✅ ${body.type} completed in ${result.total_duration ? Math.round(result.total_duration / 1000000) : 'unknown'}ms`)

    // Process and return response
    return NextResponse.json({
      response: result.response,
      metadata: {
        model: ollamaRequest.model,
        type: body.type,
        timestamp: new Date().toISOString(),
        duration: result.total_duration,
        tokens: {
          prompt: result.prompt_eval_count,
          completion: result.eval_count,
          total: (result.prompt_eval_count || 0) + (result.eval_count || 0)
        }
      }
    })

  } catch (error) {
    console.error('AI Analysis API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function getSystemPrompt(type: string): string {
  switch (type) {
    case 'visual-analysis':
      return `You are a business intelligence analyst specializing in visual content analysis. 
Your task is to analyze charts, graphs, tables, and diagrams to extract key business insights.

Focus on:
- Identifying main numerical values and their business significance
- Understanding trends, patterns, and anomalies
- Providing actionable business insights with priority levels
- Extracting relevant keywords and topics
- Contextualizing data within business operations

Always return responses in valid JSON format matching the VisualAnalysis interface structure.
Be specific with numbers, clear with insights, and actionable with recommendations.`

    case 'document-analysis':
      return `You are a senior business consultant and strategic analyst.
Your task is to analyze business documents and provide comprehensive strategic insights.

Focus on:
- Summarizing key messages and strategic implications
- Identifying actionable business recommendations with priorities
- Extracting business drivers and contextual factors
- Suggesting specific follow-up actions with owners and timelines
- Providing insights with supporting evidence and confidence levels
- Identifying relevant keywords, topics, and entities

Always return responses in valid JSON format matching the DocumentAnalysis interface structure.
Prioritize strategic value, operational impact, and actionable outcomes.`

    case 'combined-analysis':
      return `You are a chief strategy officer analyzing integrated business intelligence.
Your task is to synthesize insights from both documents and visual content to provide unified strategic guidance.

Focus on:
- Identifying correlations between textual and visual information
- Highlighting contradictions or gaps that need attention
- Creating unified insights that span multiple data sources
- Providing executive-level summary and key takeaways
- Ensuring strategic alignment across all information sources

Always return responses in valid JSON format matching the CombinedAnalysis interface structure.
Emphasize strategic coherence, cross-validation of insights, and executive decision-making support.`

    default:
      return `You are a business analyst. Provide comprehensive, actionable analysis in JSON format.`
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Check Ollama availability
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Ollama service unavailable',
          endpoint: OLLAMA_BASE_URL
        },
        { status: 503 }
      )
    }

    const models = await response.json()
    const bestModel = await getBestAvailableModel()
    
    return NextResponse.json({
      status: 'healthy',
      endpoint: OLLAMA_BASE_URL,
      models: models.models?.map((m: { name: string }) => m.name) || [],
      default_model: bestModel,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to connect to AI service',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
