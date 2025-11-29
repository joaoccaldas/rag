import { NextRequest, NextResponse } from 'next/server'

interface RAGChatRequest {
  message: string
  settings?: {
    model?: string
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
    personality?: string
    personalityDescription?: string
    verbose?: boolean
    style?: string
  }
  ragEnabled?: boolean
  documentIds?: string[]
  similarityThreshold?: number
  ragSources?: Array<{
    title: string
    content: string
    score: number
    documentId: string
  }>
}

interface SearchResult {
  chunk: {
    id: string
    content: string
    startIndex: number
    endIndex: number
  }
  document: {
    id: string
    name: string
    type: string
  }
  similarity: number
  relevantText?: string
}

export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      settings, 
      ragEnabled = false, 
      documentIds = [], 
      similarityThreshold = 0.3,
      ragSources = []
    }: RAGChatRequest = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Default settings if not provided
    const chatSettings = {
      model: settings?.model || 'llama3:latest',
      systemPrompt: settings?.systemPrompt || 'You are a helpful AI assistant for Miele dashboard analysis.',
      temperature: settings?.temperature || 0.7,
      maxTokens: settings?.maxTokens || 1000,
      personality: settings?.personality || 'professional',
      personalityDescription: settings?.personalityDescription || '',
      verbose: settings?.verbose || false,
      style: settings?.style || 'concise'
    }

    console.log('RAG-Chat request received:', {
      model: chatSettings.model,
      messageLength: message.length,
      ragEnabled,
      documentCount: documentIds.length,
      ragSourcesCount: ragSources.length,
      temperature: chatSettings.temperature
    })

    let contextualMessage = message
    let sources: SearchResult[] = []

    // If RAG is enabled, use provided RAG sources from client
    if (ragEnabled && ragSources && ragSources.length > 0) {
      console.log('Using client-provided RAG sources:', ragSources.length)
      
      // Convert ragSources to SearchResult format
      sources = ragSources.map((source, index) => ({
        chunk: {
          id: `chunk_${index}`,
          content: source.content,
          startIndex: 0,
          endIndex: source.content.length
        },
        document: {
          id: source.documentId,
          name: source.title,
          type: 'unknown'
        },
        similarity: source.score,
        relevantText: source.content.substring(0, 200) + '...'
      }))

      // Add context to the message if we found relevant documents
      if (sources.length > 0) {
        const contextChunks = sources.map((result, index) => 
          `[Source ${index + 1} from "${result.document.name}"]: ${result.chunk.content.substring(0, 500)}...`
        ).join('\n\n')

        contextualMessage = `Based on the following relevant document excerpts, please answer the user's question. If the context doesn't contain relevant information, feel free to use your general knowledge but mention that you're doing so.

CONTEXT:
${contextChunks}

USER QUESTION: ${message}

Please provide a helpful answer and cite the sources when relevant by referring to them as "Source 1", "Source 2", etc.`
      }
    } else if (ragEnabled) {
      console.warn('RAG enabled but no sources provided from client')
    }

    // Build the system message based on settings
    let systemMessage = chatSettings.systemPrompt

    // Add RAG-specific context to system prompt
    if (ragEnabled && sources.length > 0) {
      systemMessage += '\n\nYou have access to relevant document context. Use this context to provide accurate, source-backed answers. When referencing information from the context, cite the source number (e.g., "According to Source 1..."). If the context doesn\'t contain the answer, clearly state that and provide your best general knowledge response.'
    }

    // Add custom personality description if provided
    if (chatSettings.personalityDescription) {
      systemMessage += `\n\nPersonality: ${chatSettings.personalityDescription}`
    } else {
      // Add personality context
      if (chatSettings.personality === 'friendly') {
        systemMessage += ' Be warm, friendly, and conversational in your responses.'
      } else if (chatSettings.personality === 'technical') {
        systemMessage += ' Be precise, technical, and detailed in your responses.'
      } else if (chatSettings.personality === 'casual') {
        systemMessage += ' Be casual, relaxed, and use informal language.'
      } else {
        systemMessage += ' Be professional and helpful in your responses.'
      }
    }

    // Add style context
    if (chatSettings.style === 'detailed') {
      systemMessage += ' Provide comprehensive and detailed explanations.'
    } else if (chatSettings.style === 'brief') {
      systemMessage += ' Keep responses brief and to the point.'
    } else {
      systemMessage += ' Provide concise but informative responses.'
    }

    // Add verbosity context
    if (chatSettings.verbose) {
      systemMessage += ' Include reasoning and explain your thought process.'
    }

    // Make request to Ollama
    const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: chatSettings.model,
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: contextualMessage
          }
        ],
        stream: false,
        options: {
          temperature: chatSettings.temperature,
          num_predict: chatSettings.maxTokens
        }
      })
    })

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text()
      console.error('Ollama API error:', errorText)
      
      // More specific error messages
      if (errorText.includes('not found')) {
        return NextResponse.json({
          response: `The model "${chatSettings.model}" was not found. Please check your settings and ensure the model is installed with: ollama pull ${chatSettings.model}`,
          error: 'Model not found',
          sources,
          ragEnabled
        })
      }
      
      // Fallback response if Ollama is not available
      return NextResponse.json({
        response: "I'm currently having trouble connecting to the local AI service. Please ensure Ollama is running (try 'ollama serve' in terminal) and you have models installed (try 'ollama list' to check).",
        error: 'Connection failed',
        sources,
        ragEnabled
      })
    }

    const data = await ollamaResponse.json()
    
    return NextResponse.json({
      response: data.message?.content || 'Sorry, I could not generate a response.',
      model: chatSettings.model,
      settings: chatSettings,
      sources,
      ragEnabled,
      contextUsed: ragEnabled && sources.length > 0
    })

  } catch (error) {
    console.error('RAG-Chat API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process RAG chat request',
        response: "I'm experiencing technical difficulties. Please check that Ollama is running locally and try again.",
        sources: [],
        ragEnabled: false
      },
      { status: 500 }
    )
  }
}
