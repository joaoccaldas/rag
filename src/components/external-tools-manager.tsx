/**
 * Integrated External Tools for Chat
 * Provides online search, voice controls, and other external tools within the chat interface
 */

"use client"

import { useState, useCallback, useMemo } from 'react'
import { Search, Mic, Volume2, Globe, Zap, Settings } from 'lucide-react'

interface ExternalTool {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  enabled: boolean
  action: (input: string) => Promise<unknown>
}

interface SearchResult {
  title: string
  url: string
  content: string
  engine: string
}

interface ExternalToolsManagerProps {
  onToolResult: (toolId: string, result: unknown) => void
  onError: (toolId: string, error: string) => void
  className?: string
}

export function ExternalToolsManager({ 
  onToolResult, 
  onError, 
  className = '' 
}: ExternalToolsManagerProps) {
  const [activeTools, setActiveTools] = useState<Set<string>>(new Set())

  // Online Search Tool
  const performOnlineSearch = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error('Online search error:', error)
      throw error
    }
  }, [])

  // Voice Input Tool
  const startVoiceInput = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('Speech recognition not supported'))
        return
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setActiveTools(prev => new Set([...prev, 'voice-input']))
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        resolve(transcript)
      }

      recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`))
      }

      recognition.onend = () => {
        setActiveTools(prev => {
          const next = new Set(prev)
          next.delete('voice-input')
          return next
        })
      }

      recognition.start()
    })
  }, [])

  // Text-to-Speech Tool
  const speakText = useCallback(async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Text-to-speech not supported'))
        return
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      
      // Get available voices and prefer English
      const voices = window.speechSynthesis.getVoices()
      const englishVoice = voices.find(voice => voice.lang.startsWith('en-'))
      if (englishVoice) {
        utterance.voice = englishVoice
      }

      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8

      utterance.onstart = () => {
        setActiveTools(prev => new Set([...prev, 'text-to-speech']))
      }

      utterance.onend = () => {
        setActiveTools(prev => {
          const next = new Set(prev)
          next.delete('text-to-speech')
          return next
        })
        resolve()
      }

      utterance.onerror = (event) => {
        setActiveTools(prev => {
          const next = new Set(prev)
          next.delete('text-to-speech')
          return next
        })
        reject(new Error(`Text-to-speech error: ${event.error}`))
      }

      window.speechSynthesis.speak(utterance)
    })
  }, [])

  // Web Content Fetcher Tool
  const fetchWebContent = useCallback(async (url: string): Promise<string> => {
    try {
      const response = await fetch('/api/fetch-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.statusText}`)
      }

      const data = await response.json()
      return data.content || ''
    } catch (error) {
      console.error('Web content fetch error:', error)
      throw error
    }
  }, [])

  // External Tools Configuration
  const tools: ExternalTool[] = useMemo(() => [
    {
      id: 'online-search',
      name: 'Online Search',
      icon: Globe,
      description: 'Search the web for additional information',
      enabled: true,
      action: performOnlineSearch
    },
    {
      id: 'voice-input',
      name: 'Voice Input',
      icon: Mic,
      description: 'Use voice to input messages',
      enabled: typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window),
      action: startVoiceInput
    },
    {
      id: 'text-to-speech',
      name: 'Text to Speech',
      icon: Volume2,
      description: 'Convert text responses to speech',
      enabled: typeof window !== 'undefined' && 'speechSynthesis' in window,
      action: speakText
    },
    {
      id: 'web-content',
      name: 'Web Content',
      icon: Search,
      description: 'Fetch and analyze web page content',
      enabled: true,
      action: fetchWebContent
    }
  ], [performOnlineSearch, startVoiceInput, speakText, fetchWebContent])

  // Execute tool with error handling
  const executeTool = useCallback(async (toolId: string, input: string) => {
    const tool = tools.find(t => t.id === toolId)
    if (!tool || !tool.enabled) {
      onError(toolId, 'Tool not available')
      return
    }

    try {
      setActiveTools(prev => new Set([...prev, toolId]))
      const result = await tool.action(input)
      onToolResult(toolId, result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Tool execution failed'
      onError(toolId, errorMessage)
    } finally {
      setActiveTools(prev => {
        const next = new Set(prev)
        next.delete(toolId)
        return next
      })
    }
  }, [tools, onToolResult, onError])

  // Quick tool buttons
  const QuickToolButton = ({ tool }: { tool: ExternalTool }) => {
    const isActive = activeTools.has(tool.id)
    const Icon = tool.icon

    return (
      <button
        onClick={() => {
          if (tool.id === 'voice-input') {
            executeTool(tool.id, '')
          } else {
            // For other tools, you might want to show an input modal
            // For now, we'll handle them differently in the chat interface
          }
        }}
        disabled={!tool.enabled || isActive}
        className={`p-2 rounded-lg border transition-all ${
          isActive
            ? 'bg-blue-500 text-white border-blue-500 animate-pulse'
            : tool.enabled
            ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'
        }`}
        title={tool.description}
      >
        <Icon className="w-4 h-4" />
      </button>
    )
  }

  return (
    <div className={`external-tools-manager ${className}`}>
      {/* Quick Access Toolbar */}
      <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-1">
          <Zap className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Tools:</span>
        </div>
        
        <div className="flex space-x-1">
          {tools.map(tool => (
            <QuickToolButton key={tool.id} tool={tool} />
          ))}
        </div>

        {/* Settings */}
        <button
          className="p-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                   border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Tool Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Tool Status */}
      {activeTools.size > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {Array.from(activeTools).map(toolId => {
            const tool = tools.find(t => t.id === toolId)
            if (!tool) return null
            
            const Icon = tool.icon
            return (
              <div
                key={toolId}
                className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 
                         text-blue-800 dark:text-blue-200 rounded-full text-xs"
              >
                <Icon className="w-3 h-3" />
                <span>{tool.name} active...</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Helper hook for using external tools in chat components
export function useExternalTools() {
  const [toolResults, setToolResults] = useState<Record<string, unknown>>({})
  const [toolErrors, setToolErrors] = useState<Record<string, string>>({})

  const handleToolResult = useCallback((toolId: string, result: unknown) => {
    setToolResults(prev => ({ ...prev, [toolId]: result }))
    // Clear any previous error for this tool
    setToolErrors(prev => {
      const next = { ...prev }
      delete next[toolId]
      return next
    })
  }, [])

  const handleToolError = useCallback((toolId: string, error: string) => {
    setToolErrors(prev => ({ ...prev, [toolId]: error }))
    // Clear any previous result for this tool
    setToolResults(prev => {
      const next = { ...prev }
      delete next[toolId]
      return next
    })
  }, [])

  const clearToolData = useCallback((toolId?: string) => {
    if (toolId) {
      setToolResults(prev => {
        const next = { ...prev }
        delete next[toolId]
        return next
      })
      setToolErrors(prev => {
        const next = { ...prev }
        delete next[toolId]
        return next
      })
    } else {
      setToolResults({})
      setToolErrors({})
    }
  }, [])

  return {
    toolResults,
    toolErrors,
    handleToolResult,
    handleToolError,
    clearToolData
  }
}

export default ExternalToolsManager
