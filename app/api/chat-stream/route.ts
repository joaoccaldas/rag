import { NextRequest } from 'next/server'
import { groq, chatCompletion } from '@/lib/groq-client'

export async function POST(request: NextRequest) {
  try {
    const { message, settings, ragSources } = await request.json()

    if (!message) {
      return new Response('Message is required', { status: 400 })
    }

    // Default settings if not provided
    const chatSettings = {
            model: settings?.model || 'llama-3.1-70b-versatile',
      systemPrompt: settings?.systemPrompt || 'You are a helpful AI assistant for Miele dashboard analysis.',
      temperature: settings?.temperature || 0.7,
      maxTokens: settings?.maxTokens || 1000,
      personality: settings?.personality || 'professional',
      personalityDescription: settings?.personalityDescription || '',
      verbose: settings?.verbose || false,
      style: settings?.style || 'concise',
      userName: settings?.userName || '',
      botName: settings?.botName || 'AI Assistant',
      welcomeMessage: settings?.welcomeMessage || '',
      avatarUrl: settings?.avatarUrl || null
    }

    console.log('Streaming chat request received:', {
      model: chatSettings.model,
      messageLength: message.length,
      temperature: chatSettings.temperature,
      hasRagSources: !!ragSources,
      personality: chatSettings.personality,
      userName: chatSettings.userName,
      botName: chatSettings.botName,
      hasCustomAvatar: !!chatSettings.avatarUrl,
      systemPromptLength: chatSettings.systemPrompt.length
    })

    // Build the system message based on settings
    let systemMessage = chatSettings.systemPrompt

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

    // Add user and bot names for personalization
    if (chatSettings.userName && chatSettings.botName) {
      systemMessage += `\n\nYou are "${chatSettings.botName}" and you are chatting with "${chatSettings.userName}".`
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

    // Prepare the user message with RAG context if available
    let userMessage = message
    if (ragSources && ragSources.length > 0) {
      const ragContext = ragSources.map((source: { title: string; content: string }, index: number) => 
        `[Source ${index + 1}: ${source.title}]\n${source.content}`
      ).join('\n\n')
      
      systemMessage += '\n\nWhen answering, use the provided context sources. If you reference information from the sources, mention which source it came from.'
      userMessage = `Context from knowledge base:\n\n${ragContext}\n\nUser question: ${message}`
    }

    // Create a ReadableStream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        let isClosed = false
        
        const safeEnqueue = (data: string) => {
          if (!isClosed) {
            try {
              controller.enqueue(data)
            } catch (error) {
              const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : null
              if (errorCode !== 'ERR_INVALID_STATE') {
                console.warn('Controller enqueue failed:', error)
              }
              isClosed = true
            }
          }
        }
        
        const safeClose = () => {
          if (!isClosed) {
            try {
              controller.close()
              isClosed = true
            } catch (error) {
              const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : null
              if (errorCode !== 'ERR_INVALID_STATE') {
                console.warn('Controller close failed:', error)
              }
              isClosed = true
            }
          }
        }

        try {
          console.log('Final system message being sent to Ollama:', systemMessage)
          
// Use Groq API for chat completion
      const response = await chatCompletion({
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: message }
        ],
        model: chatSettings.model,
        temperature: chatSettings.temperature,
        maxTokens: chatSettings.maxTokens
      })

      const aiResponse = response.choices[0]?.message?.content || 'No response generated'

      // Return as plain text response
      return new Response(aiResponse, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    } catch (error) {
      console.error('API error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to process chat request',
          content: "I'm experiencing technical difficulties. Please try again."
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}
