"use client"

import { useState, useRef, useEffect, useCallback, memo } from "react"
import { Send, Bot, Loader2, Database } from "lucide-react"
import Image from "next/image"
import { useSettings } from '@/contexts/SettingsContext'
import { SettingsModal } from '../settings-modal'
import { useChatFeatures } from '../chat-features-settings'
import { useRAG } from '@/rag/contexts/RAGContext'
import { ChatHeader } from './chat-header'
import { ChatToolbar } from './ChatToolbar'
import { useOllamaConnection, OllamaConnectionStatus } from '../connection/enhanced-ollama-connection'
import DocumentPreviewModal from '../document-preview-modal'
import { ChatMessage } from './chat-message'
import { useProfiledChatSettings, useActiveProfile } from '@/hooks/useActiveProfile'
import './formatting/markdown-styles.css'
import { Message } from './types'
import { createSemanticCacheWrapper } from '@/rag/utils/semantic-cache-wrapper'
import { generateEmbedding } from '@/rag/utils/document-processing'
import type { CacheResult } from '@/rag/utils/semantic-cache'

interface ConsolidatedChatViewProps {
  variant?: 'enhanced' | 'classic'
  showToolbar?: boolean
  showModelSelector?: boolean
  className?: string
}

const ConsolidatedChatViewComponent = ({ 
  className = ''
}: ConsolidatedChatViewProps) => {
  // State management
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isRagEnabled, setIsRagEnabled] = useState(true) // Default to enabled
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null)
  const [semanticCache, setSemanticCache] = useState<Awaited<ReturnType<typeof createSemanticCacheWrapper>> | null>(null)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Context hooks
  const { settings } = useSettings()
  const [features, setFeatures] = useChatFeatures()
  const { searchDocuments, documents } = useRAG()
  const { activeProfile } = useActiveProfile()
  
  // Use profiled settings that combine base settings with active profile
  const effectiveSettings = useProfiledChatSettings(settings as unknown as Record<string, unknown>)
  
  // Enhanced Ollama connection management
  const ollamaConnection = useOllamaConnection()

  // Toolbar handlers
  const handleVoiceInput = useCallback((transcript: string) => {
    setInputValue(transcript)
  }, [])

  const handleSearchResults = useCallback((results: Array<{title: string; content: string; url: string; engine: string}>) => {
    // Add search results as a message
    const searchMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: `Found ${results.length} search results:\n\n${results.map(r => `**${r.title}**\n${r.content}\n${r.url}`).join('\n\n')}`,
      timestamp: new Date(),
      source: 'web'
    }
    setMessages(prev => [...prev, searchMessage])
  }, [])

  const handleTextToSpeech = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const handleFileUpload = useCallback(() => {
    // File upload functionality would go here
    console.log('File upload clicked')
  }, [])

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Initialize semantic cache
  useEffect(() => {
    createSemanticCacheWrapper({
      enableSemanticCache: true,
      useLegacyCache: true,
      preferSemanticCache: true
    }).then(cache => {
      setSemanticCache(cache)
      console.log('✅ Semantic cache initialized for chat')
    }).catch(error => {
      console.error('Failed to initialize semantic cache:', error)
    })
  }, [])

  // Handle auto-resize of textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    
    // Auto-resize
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }, [])

  // Enhanced message sending with fixed RAG integration
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    // Clear input and add user message
    setInputValue('')
    setIsLoading(true)

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    try {
      const useRAG = isRagEnabled && documents.length > 0

      // Enhanced RAG Search with proper error handling
      let ragSources: Array<{title: string, content: string, score: number, documentId: string, chunkId?: string}> = []

      if (useRAG) {
        try {
          console.log(`🔍 Starting RAG search for: "${content}"`)
          console.log(`📚 Available documents: ${documents.length}`)
          
          // Check semantic cache first
          if (semanticCache) {
            const queryEmbedding = await generateEmbedding(content)
            const cachedResults = await semanticCache.get(content, queryEmbedding)
            
            if (cachedResults && cachedResults.length > 0) {
              console.log(`✨ Chat Semantic Cache HIT: Found ${cachedResults.length} cached RAG sources`)
              
              // Convert cached results to ragSources format
              ragSources = cachedResults.slice(0, 8).map((cached: CacheResult) => ({
                title: (cached.metadata?.['title'] as string) || 'Cached Document',
                content: cached.content,
                score: cached.score,
                documentId: (cached.metadata?.['documentId'] as string) || cached.id,
                chunkId: cached.id
              }))
              
              const uniqueDocuments = [...new Set(ragSources.map(s => s.title))]
              console.log(`🎯 Using ${ragSources.length} cached RAG sources from ${uniqueDocuments.length} documents`)
              
              // Skip the full search since we have cached results
            } else {
              console.log(`💨 Cache MISS: Performing full RAG search`)
              await performFullRAGSearch()
            }
          } else {
            // No cache available, perform full search
            await performFullRAGSearch()
          }
          
          async function performFullRAGSearch() {
            const searchResults = await searchDocuments(content)
          
            if (searchResults && searchResults.length > 0) {
            console.log(`✅ RAG search completed: ${searchResults.length} results found`)
            
            // Debug: Log the structure of first search result
            if (searchResults[0]) {
              console.log('🔍 First search result structure:', {
                hasDocument: !!searchResults[0].document,
                hasChunk: !!searchResults[0].chunk,
                documentName: searchResults[0].document?.name,
                chunkContent: searchResults[0].chunk?.content?.substring(0, 100)
              })
            }
            
            // Enhanced filtering and content verification
            const processedResults = searchResults.filter(result => {
              // Check if result has the required properties
              const hasDocument = result.document && result.document.name
              const hasContent = result.chunk && result.chunk.content
              
              if (!hasDocument || !hasContent) {
                console.log('❌ Filtering out result due to missing properties:', {
                  hasDocument: !!hasDocument,
                  hasContent: !!hasContent,
                  documentName: result.document?.name,
                  chunkId: result.chunk?.id
                })
                return false
              }
              
              // Enhanced content relevance verification
              const queryWords = content.toLowerCase().split(/\s+/)
              const chunkContent = result.chunk?.content?.toLowerCase() || ''
              const documentName = result.document?.name?.toLowerCase() || ''
              
              // Count exact word matches in content
              const contentMatches = queryWords.filter(word => 
                word.length > 2 && chunkContent.includes(word)
              ).length
              
              // Count matches in document name
              const nameMatches = queryWords.filter(word => 
                word.length > 2 && documentName.includes(word)
              ).length
              
              // Require at least some relevance
              const totalMatches = contentMatches + nameMatches
              const isRelevant = totalMatches > 0 || (result.similarity || 0) > 0.3
              
              if (!isRelevant) {
                console.log('❌ Filtering out result due to low relevance:', {
                  documentName: result.document?.name || 'Unknown',
                  contentMatches,
                  nameMatches,
                  similarity: result.similarity || 0,
                  chunkPreview: result.chunk?.content?.substring(0, 100) || ''
                })
              }
              
              return isRelevant
            })

            console.log(`📊 Filtered results: ${processedResults.length} out of ${searchResults.length} passed filtering`)

            ragSources = processedResults
              .slice(0, 8)
              .map(result => {
                return {
                  title: result.document?.name || 'Unknown Document',
                  content: result.chunk?.content || '',
                  score: result.similarity || result.score || 0,
                  documentId: result.document?.id || '',
                  chunkId: result.chunk?.id || ''
                }
              })

            const uniqueDocuments = ragSources?.length > 0 
              ? [...new Set(ragSources.map(s => s.title))]
              : []
            console.log(`🎯 Using ${ragSources.length} RAG sources from ${uniqueDocuments.length} documents`)
            
            // Debug: Log first source to verify content
            if (ragSources.length > 0 && ragSources[0]) {
              console.log('📄 First RAG source sample:', {
                title: ragSources[0].title,
                contentLength: ragSources[0].content.length,
                contentPreview: ragSources[0].content.substring(0, 100),
                score: ragSources[0].score
              })
            }
            
            // Store results in semantic cache for future similar queries
            if (semanticCache && ragSources.length > 0) {
              const queryEmbedding = await generateEmbedding(content)
              const cacheResults: CacheResult[] = ragSources.map(source => ({
                id: source.chunkId || source.documentId,
                score: source.score,
                content: source.content,
                metadata: {
                  documentId: source.documentId,
                  title: source.title
                }
              }))
              
              const documentIds = [...new Set(ragSources.map(s => s.documentId))]
              await semanticCache.set(content, queryEmbedding, cacheResults, documentIds)
              console.log('💾 Cached RAG sources for future queries')
            }
          } else {
            console.log('❌ No RAG results found for query:', content)
          }
          } // Close performFullRAGSearch function
          
        } catch (error) {
          console.error('❌ RAG search failed:', error)
          // Continue without RAG if search fails
        }
      }

      // Send message to API
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: content,
          settings: {
            model: settings.model, // Use original settings model, not effectiveSettings
            systemPrompt: effectiveSettings.systemPrompt,
            temperature: effectiveSettings.temperature,
            maxTokens: effectiveSettings.maxTokens,
            personality: effectiveSettings.personality,
            personalityDescription: effectiveSettings.personalityDescription,
            verbose: settings.verbose,
            style: settings.style,
            userName: settings.userName,
            botName: effectiveSettings.botName,
            welcomeMessage: settings.welcomeMessage,
            avatarUrl: settings.avatarUrl
          },
          ragSources: useRAG ? ragSources : undefined
        })
      }
      
      if (abortControllerRef.current?.signal) {
        requestOptions.signal = abortControllerRef.current.signal
      }

      // Always use chat-stream (it handles RAG sources properly)
      const response = await fetch('/api/chat-stream', requestOptions)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: '',
        timestamp: new Date(),
        source: useRAG ? 'rag' : 'internal',
        ...(useRAG && ragSources && { ragSources })
      }

      setMessages(prev => [...prev, botMessage])

      let accumulatedContent = ''
      let isComplete = false
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                accumulatedContent += data.content
                setMessages(prev => prev.map(msg => 
                  msg.id === botMessage.id 
                    ? { ...msg, content: accumulatedContent, isStreaming: !data.done }
                    : msg
                ))
              }
              
              // Mark as complete when done
              if (data.done) {
                isComplete = true
                setMessages(prev => prev.map(msg => 
                  msg.id === botMessage.id 
                    ? { ...msg, isStreaming: false, isComplete: true }
                    : msg
                ))
              }
              
              // Handle RAG sources only when streaming is complete
              if (data.ragSources && isComplete) {
                setMessages(prev => prev.map(msg => 
                  msg.id === botMessage.id 
                    ? { ...msg, ragSources: data.ragSources }
                    : msg
                ))
              }
            } catch {
              // Ignore parsing errors for partial chunks
            }
          }
        }
      }

    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted')
      } else {
        console.error('Chat error:', error)
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [isLoading, isRagEnabled, documents, searchDocuments, settings, effectiveSettings, semanticCache])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputValue)
    }
  }, [inputValue, handleSendMessage])

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {/* Header with Model Selection */}
      <ChatHeader
        connectionStatus={{
          connected: ollamaConnection.isConnected,
          model: settings.model,
          loading: ollamaConnection.isConnecting,
          ...(ollamaConnection.error ? { error: ollamaConnection.error } : {})
        }}
        onSettingsClick={() => setIsSettingsOpen(true)}
        isRagEnabled={isRagEnabled}
        onRagToggle={setIsRagEnabled}
        activeUsers={1}
      />

      {/* Enhanced Ollama Connection Status */}
      <div className="px-4 pt-2">
        <OllamaConnectionStatus />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
            {/* Display custom avatar or default bot icon */}
            {settings.avatarUrl ? (
              <Image 
                src={settings.avatarUrl} 
                alt={settings.botName || "AI Assistant"} 
                width={64}
                height={64}
                className="w-16 h-16 mb-6 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              />
            ) : (
              <Bot className="w-16 h-16 mb-6 opacity-50" />
            )}
            
            {/* Dynamic welcome title using bot name */}
            <h3 className="text-xl font-semibold mb-3 text-center">
              Welcome to {effectiveSettings.botName || settings.botName || 'Miele AI Assistant'}
            </h3>
            
            {/* Active Profile Debug Info */}
            {activeProfile && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>🎯 Active Profile:</strong> {activeProfile.displayName || activeProfile.name}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  <strong>Personality:</strong> {activeProfile.personality} | <strong>Bot Name:</strong> {activeProfile.chatbotName} | <strong>Model:</strong> {settings.model}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  <strong>Profile ID:</strong> {activeProfile.id} | <strong>System Prompt:</strong> {activeProfile.systemPrompt?.substring(0, 50)}...
                </p>
              </div>
            )}
            
            {!activeProfile && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ No active profile detected. Please select a profile from the first page.
                </p>
              </div>
            )}
            
            <div className="text-center max-w-2xl space-y-3">
              {/* Display custom welcome message or default */}
              <p className="text-lg">
                {!ollamaConnection.isConnected 
                  ? "Connect to start chatting with AI assistance for your Miele dashboard."
                  : (effectiveSettings.personalityDescription || settings.welcomeMessage || "Your intelligent assistant for Miele data analysis and insights.")
                }
              </p>
              
              {ollamaConnection.isConnected && (
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-foreground">🤖 Currently using: {settings.model}</p>
                  
                  {isRagEnabled && documents.length > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                      <Database className="w-4 h-4" />
                      <span className="font-medium">
                        RAG enabled with {documents.length} document{documents.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : (
                    <p className="text-amber-600 dark:text-amber-400">
                      💡 Enable RAG in the header to get document-enhanced responses
                    </p>
                  )}
                  
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs space-y-1">
                    <p className="font-medium text-foreground">✨ Enhanced Features:</p>
                    <p>• Document-aware responses with source citations</p>
                    <p>• Model selection with size information</p>
                    <p>• Real-time connection status</p>
                    <p>• Professional message formatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              showSources={true}
              showFeedback={true}
              onSourceClick={(source) => {
                // Use the proper DocumentPreviewModal instead of the simple inline modal
                setPreviewDocumentId(source.documentId)
              }}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border bg-card">
        {/* Chat Toolbar */}
        <div className="px-4 py-2 border-b border-border">
          <ChatToolbar
            chatFeatures={features}
            onChatFeaturesChange={setFeatures}
            onVoiceInput={handleVoiceInput}
            onSearchResults={handleSearchResults}
            onTextToSpeech={handleTextToSpeech}
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
          />
        </div>
        
        {/* Message Input */}
        <div className="p-4">
          <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              !ollamaConnection.isConnected 
                ? "Connect to start chatting..." 
                : activeProfile 
                  ? `Ask ${activeProfile.chatbotName || 'AI Assistant'}...`
                  : "Type your message..."
            }
            disabled={isLoading || !ollamaConnection.isConnected}
            className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] max-h-32 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm"
            rows={1}
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isLoading || !ollamaConnection.isConnected}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-colors min-h-[44px]"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        </div>
      </div>

      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Selected Document Modal */}
      {/* Document Preview Modal */}
      {previewDocumentId && (
        <DocumentPreviewModal
          documentId={previewDocumentId}
          isOpen={true}
          onClose={() => setPreviewDocumentId(null)}
        />
      )}
    </div>
  )
}

ConsolidatedChatViewComponent.displayName = 'ConsolidatedChatView'

export const ConsolidatedChatView = memo(ConsolidatedChatViewComponent)
export default ConsolidatedChatView
