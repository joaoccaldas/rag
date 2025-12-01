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
          
          // Make request to Ollama with streaming enabled
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
                  content: userMessage
                }
              ],
              stream: true,
              keep_alive: chatSettings.model.includes('gpt-oss') ? '15m' : '5m', // Keep large models loaded longer
              options: {
                temperature: chatSettings.temperature,
                num_predict: chatSettings.maxTokens,
                // Optimize for GPT-OSS performance
                ...(chatSettings.model.includes('gpt-oss') && {
                  num_ctx: 2048, // Reduce context window for faster responses
                  num_batch: 256, // Smaller batch size for lower memory usage
                  num_gpu: -1, // Use all available GPUs
                  low_vram: true, // Enable low VRAM mode for performance
                  f16_kv: true, // Use half-precision for key-value cache
                  use_mlock: true, // Lock model in memory
                  use_mmap: true, // Memory map model files
                  num_thread: Math.max(1, Math.floor(cpus().length * 0.8)), // Use 80% of CPU cores
                  repeat_penalty: 1.1, // Prevent repetition
                  top_k: 40, // Limit token selection for faster processing
                  top_p: 0.9, // Nuclear sampling for efficiency
                  typical_p: 1.0,
                  tfs_z: 1.0
                })
              }
            })
          })

          if (!ollamaResponse.ok) {
            const errorText = await ollamaResponse.text()
            console.error('Ollama API error:', errorText)
            
            let errorMessage = "I'm currently having trouble connecting to the local AI service."
            if (errorText.includes('not found')) {
              errorMessage = `The model "${chatSettings.model}" was not found. Please check your settings and ensure the model is installed.`
            }
            
            safeEnqueue(`data: ${JSON.stringify({ 
              error: true, 
              content: errorMessage 
            })}\n\n`)
            safeClose()
            return
          }

          // Handle the streaming response
          const reader = ollamaResponse.body?.getReader()
          if (!reader) {
            safeEnqueue(`data: ${JSON.stringify({ 
              error: true, 
              content: 'Failed to read response stream' 
            })}\n\n`)
            safeClose()
            return
          }

          try {
            while (true && !isClosed) {
              const { done, value } = await reader.read()
              
              if (done) {
                // Send completion event
                safeEnqueue(`data: ${JSON.stringify({ 
                  done: true 
                })}\n\n`)
                break
              }

              // Parse the chunk
              const chunk = new TextDecoder().decode(value)
              const lines = chunk.split('\n').filter(line => line.trim())
              
              for (const line of lines) {
                if (isClosed) break
                
                try {
                  const data = JSON.parse(line)
                  if (data.message?.content) {
                    // Send the content chunk
                    safeEnqueue(`data: ${JSON.stringify({ 
                      content: data.message.content,
                      done: false 
                    })}\n\n`)
                  }
                  
                  // Check if streaming is complete
                  if (data.done) {
                    safeEnqueue(`data: ${JSON.stringify({ 
                      done: true 
                    })}\n\n`)
                    break
                  }
                } catch (parseError) {
                  // Skip malformed JSON
                  console.warn('Failed to parse streaming chunk:', parseError)
                }
              }
            }
          } finally {
            reader.releaseLock()
          }

        } catch (error) {
          console.error('Streaming error:', error)
          safeEnqueue(`data: ${JSON.stringify({ 
            error: true, 
            content: 'An error occurred while generating the response' 
          })}\n\n`)
        }
        
        safeClose()
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
    console.error('API error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        content: "I'm experiencing technical difficulties. Please check that Ollama is running locally and try again."
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
