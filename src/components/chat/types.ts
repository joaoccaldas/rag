/**
 * Chat Message Types and Interfaces
 * Centralized type definitions for the chat system
 */

export interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  source?: 'internal' | 'web' | 'rag'
  searchUrl?: string
  searchQuery?: string
  queryText?: string
  ragSources?: RAGSource[]
  metadata?: Record<string, unknown>
  // Streaming states
  isStreaming?: boolean
  isComplete?: boolean
}

export interface RAGSource {
  title: string
  content: string
  score: number
  documentId: string
  chunkId?: string
  metadata?: Record<string, unknown>
}

export interface ConnectionStatus {
  connected: boolean
  model: string
  loading: boolean
  error?: string
  lastChecked?: Date
}

export interface SearchResult {
  title: string
  url: string
  content: string
  engine: string
  timestamp?: Date
}

export interface ChatState {
  messages: Message[]
  currentMessage: string
  isLoading: boolean
  connectionStatus: ConnectionStatus
  selectedModel: string
  ragEnabled: boolean
}

export interface ChatActions {
  sendMessage: (content: string) => Promise<void>
  setCurrentMessage: (message: string) => void
  clearMessages: () => void
  loadMessages: (messages: Message[]) => void
  setSelectedModel: (model: string) => void
  toggleRAG: (enabled: boolean) => void
  retryLastMessage: () => Promise<void>
}

// Message validation
export function validateMessage(content: string): { isValid: boolean; error?: string } {
  if (!content.trim()) {
    return { isValid: false, error: 'Message cannot be empty' }
  }
  
  if (content.length > 4000) {
    return { isValid: false, error: 'Message too long (max 4000 characters)' }
  }

  return { isValid: true }
}

// Message formatting utilities
export function formatMessageContent(content: string): string {
  // Basic formatting: preserve line breaks, handle URLs, etc.
  return content
    .replace(/\n/g, '<br />')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function createUserMessage(content: string): Message {
  return {
    id: generateMessageId(),
    type: 'user',
    content: content.trim(),
    timestamp: new Date(),
  }
}

export function createBotMessage(content: string, source?: Message['source'], metadata?: Record<string, unknown>): Message {
  return {
    id: generateMessageId(),
    type: 'bot',
    content: content.trim(),
    timestamp: new Date(),
    ...(source && { source }),
    ...(metadata && { metadata }),
  }
}
