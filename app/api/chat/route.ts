import { NextRequest, NextResponse } from 'next/server'
import { groq } from '@/lib/groq-client'

export async function POST(request: NextRequest) {
  try {
    const { message, settings } = await request.json()

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

    console.log('Chat request received:', {
      model: chatSettings.model,
      messageLength: message.length,
      temperature: chatSettings.temperature
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
            content: message
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
          error: 'Model not found'
        })
      }
      
      // Fallback response if Ollama is not available
      return NextResponse.json({
        response: "I'm currently having trouble connecting to the local AI service. Please ensure Ollama is running (try 'ollama serve' in terminal) and you have models installed (try 'ollama list' to check).",
        error: 'Connection failed'
      })
    }

    const data = await ollamaResponse.json()
    
    return NextResponse.json({
      response: data.message?.content || 'Sorry, I could not generate a response.',
      model: chatSettings.model,
      settings: chatSettings
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        response: "I'm experiencing technical difficulties. Please check that Ollama is running locally and try again."
      },
      { status: 500 }
    )
  }
}
