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
      model: settings?.model || 'llama3.2:3b', // Use specific version with tag
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
        const uniqueDocuments = [...new Set(sources.map(s => s.document.name))]
        console.log(`Using ${sources.length} sources from ${uniqueDocuments.length} documents:`, uniqueDocuments)
        
        const contextChunks = sources.map((result, index) => 
          `[Source ${index + 1} from "${result.document.name}" (similarity: ${result.similarity.toFixed(2)})]: ${result.chunk.content.substring(0, 800)}...`
        ).join('\n\n')

        contextualMessage = `Based on the following relevant document excerpts, please answer the user's question. Use information from multiple sources when available and cite them appropriately.

CONTEXT FROM ${uniqueDocuments.length} DOCUMENT(S):
${contextChunks}

USER QUESTION: ${message}

Please provide a comprehensive answer using the context above. When referencing information, cite the sources (e.g., "According to Source 1 from [document name]..."). If you need to combine information from multiple sources, do so clearly. If the context doesn't fully answer the question, supplement with your general knowledge but indicate which parts come from the provided context versus your general knowledge.`
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

    // Try multiple connection methods for Ollama
    let ollamaResponse: Response
    let connectionMethod = 'unknown'
    
    const requestBody = JSON.stringify({
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
      stream: true, // Enable streaming for consistency
      options: {
        temperature: chatSettings.temperature,
        num_predict: chatSettings.maxTokens
      }
    })

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody
    }

    try {
      // Try localhost first (most common for development)
      console.log('🔄 Attempting localhost Ollama connection...')
      ollamaResponse = await fetch('http://localhost:11434/api/chat', {
        ...requestOptions,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      if (ollamaResponse.ok) {
        connectionMethod = 'localhost'
        console.log('✅ Using localhost Ollama connection')
      } else {
        throw new Error('Localhost connection failed')
      }
    } catch (localError) {
      console.log('🔄 Localhost failed, trying proxy route...')
      
      try {
        // Fallback to proxy route
        ollamaResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ollama-proxy?endpoint=/api/chat`, {
          ...requestOptions,
          signal: AbortSignal.timeout(15000) // 15 second timeout for proxy
        })
        
        if (ollamaResponse.ok) {
          connectionMethod = 'proxy'
          console.log('✅ Using Ollama proxy connection')
        } else {
          throw new Error('Proxy connection failed')
        }
      } catch (proxyError) {
        console.error('❌ All Ollama connection methods failed:', { localError, proxyError })
        
        // Return a helpful error response
        return NextResponse.json({
          error: 'Ollama service unavailable',
          message: 'Both direct and proxy connections to Ollama failed. Please ensure Ollama is running.',
          details: {
            localhost: localError instanceof Error ? localError.message : 'Connection failed',
            proxy: proxyError instanceof Error ? proxyError.message : 'Connection failed'
          },
          installationHelp: 'Visit https://ollama.com/download to install Ollama, then run: ollama serve'
        }, { status: 503 })
      }
    }

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text()
      console.error(`❌ Ollama API error (${connectionMethod}):`, errorText)
      
      // Return streaming error response
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          const errorMessage = errorText.includes('not found') 
            ? `The model "${chatSettings.model}" was not found. Please check your settings.`
            : "I'm currently having trouble connecting to the local AI service."
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: errorMessage, done: true })}\n\n`))
          controller.close()
        }
      })
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Success - log connection method used
    console.log(`✅ Ollama chat request successful via ${connectionMethod}`)

    // Return the streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaResponse.body?.getReader()
        if (!reader) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: 'Sorry, I could not generate a response.', done: true })}\n\n`))
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.trim() && line.startsWith('{')) {
                try {
                  const data = JSON.parse(line)
                  if (data.message?.content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                      content: data.message.content,
                      ragSources: sources.length > 0 ? sources : undefined
                    })}\n\n`))
                  }
                  if (data.done) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, ragSources: sources })}\n\n`))
                    controller.close()
                    return
                  }
                } catch (parseError) {
                  // Ignore parsing errors for partial chunks
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: 'Error occurred while streaming response.', done: true })}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
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
