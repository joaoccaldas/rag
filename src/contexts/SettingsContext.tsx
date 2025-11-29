"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { StorageManager } from '../utils/storage-manager'

export interface ChatSettings {
  model: string
  useLocalModel: boolean
  localModelPath?: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  personality: 'professional' | 'friendly' | 'technical' | 'casual'
  personalityDescription: string
  avatarUrl: string | null
  verbose: boolean
  style: 'concise' | 'detailed' | 'brief'
  // New chat personality fields
  welcomeMessage: string
  userName: string
  botName: string
  botNameColor: string // New field for custom bot name color
}

interface SettingsContextType {
  settings: ChatSettings
  updateSettings: (newSettings: Partial<ChatSettings>) => void
  resetSettings: () => void
  saveSettings: () => void
}

const defaultSettings: ChatSettings = {
  model: 'mistral:latest', // Use a model that actually exists
  useLocalModel: false,
  localModelPath: '',
  systemPrompt: 'You are a helpful AI assistant for Miele analytics platform. You can help users understand their data, provide insights, and answer questions about platform performance and analytics.',
  temperature: 0.7,
  maxTokens: 1000,
  personality: 'professional',
  personalityDescription: 'A knowledgeable and professional assistant specializing in data analysis and providing clear insights about analytics and platform metrics.',
  avatarUrl: null,
  verbose: false,
  style: 'concise',
  // New chat personality fields
  welcomeMessage: 'Hello! I\'m your Caldas AI assistant. I can help you analyze your dashboard data, provide insights, and answer questions about platform performance. How can I assist you today?',
  userName: 'User',
  botName: 'Caldas Assistant',
  botNameColor: '#3b82f6' // Default blue color
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ChatSettings>(defaultSettings)

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Monitor storage on startup
        StorageManager.monitorStorage()
        
        // First try to load from unlimited storage
        try {
          const { UnlimitedRAGStorage } = await import('../storage/unlimited-rag-storage')
          const storage = new UnlimitedRAGStorage()
          const settingsDoc = await storage.getDocument('chat-settings')
          
          if (settingsDoc && settingsDoc.content) {
            const parsedSettings = JSON.parse(settingsDoc.content)
            
            // If avatar is stored separately, load it
            if (parsedSettings.avatarUrl?.startsWith('storage:')) {
              const avatarId = parsedSettings.avatarUrl.replace('storage:', '')
              try {
                const avatarDoc = await storage.getDocument(avatarId)
                if (avatarDoc && avatarDoc.content) {
                  parsedSettings.avatarUrl = avatarDoc.content
                  console.log('✅ Avatar loaded from unlimited storage')
                }
              } catch (avatarError) {
                console.warn('Could not load avatar:', avatarError)
                parsedSettings.avatarUrl = null
              }
            }
            
            console.log('✅ Settings loaded from unlimited storage')
            setSettings({ ...defaultSettings, ...parsedSettings })
            return
          }
        } catch (unlimitedError) {
          console.warn('Could not load from unlimited storage, trying localStorage:', unlimitedError)
        }
        
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('miele-chat-settings')
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings)
          
          // Check if the model is invalid (embedding model or doesn't exist)
          if (parsedSettings.model && (
            parsedSettings.model.includes('embed') || 
            parsedSettings.model === 'llama3.2' ||
          parsedSettings.model === 'llama3:latest'
        )) {
          console.log('Clearing invalid model settings:', parsedSettings.model)
          localStorage.removeItem('miele-chat-settings')
          setSettings(defaultSettings)
          return
        }
        
        setSettings({ ...defaultSettings, ...parsedSettings })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      localStorage.removeItem('miele-chat-settings')
      setSettings(defaultSettings)
    }
    }
    
    loadSettings()
  }, [])

  const updateSettings = (newSettings: Partial<ChatSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const saveSettings = async () => {
    try {
      // Use unlimited storage for settings persistence
      const { UnlimitedRAGStorage } = await import('../storage/unlimited-rag-storage')
      const storage = new UnlimitedRAGStorage()
      
      // Handle avatar separately to prevent quota issues
      let settingsToStore = { ...settings }
      let avatarId: string | null = null
      
      if (settings.avatarUrl && settings.avatarUrl.startsWith('data:')) {
        // Store avatar image separately in unlimited storage
        try {
          avatarId = `avatar-${Date.now()}`
          const avatarDoc = {
            id: avatarId,
            name: 'User Avatar',
            content: settings.avatarUrl,
            type: 'image',
            createdAt: new Date().toISOString()
          }
          
          await storage.storeDocument(avatarDoc)
          console.log('✅ Avatar stored separately in unlimited storage')
          
          // Store only the reference in settings
          settingsToStore = { ...settings, avatarUrl: `storage:${avatarId}` }
        } catch (avatarError) {
          console.warn('Failed to store avatar separately, keeping in settings:', avatarError)
        }
      }
      
      // Store settings in unlimited storage
      const settingsDoc = {
        id: 'chat-settings',
        name: 'Chat Settings',
        content: JSON.stringify(settingsToStore),
        type: 'settings',
        createdAt: new Date().toISOString()
      }
      
      await storage.storeDocument(settingsDoc)
      console.log('✅ Settings saved to unlimited storage')
      
      // Also save to localStorage as fallback for quick access (without large avatar)
      try {
        const lightSettings = { ...settingsToStore }
        if (lightSettings.avatarUrl?.startsWith('data:')) {
          lightSettings.avatarUrl = null // Remove large base64 data from localStorage
        }
        
        const settingsString = JSON.stringify(lightSettings)
        if (settingsString.length < 1024 * 50) { // Only if less than 50KB
          localStorage.setItem('miele-chat-settings', settingsString)
        }
      } catch {
        console.warn('localStorage full, but unlimited storage succeeded')
      }
      
    } catch (storageError) {
      console.error('Failed to save to unlimited storage, using localStorage fallback:', storageError)
      
      // Fallback with avatar compression
      try {
        let settingsToSave = { ...settings }
        
        // If avatar is too large, store a compressed version or remove it
        if (settings.avatarUrl && settings.avatarUrl.length > 100000) {
          console.warn('Avatar too large for localStorage, removing from fallback save')
          settingsToSave = { ...settings, avatarUrl: null }
        }
        
        localStorage.setItem('miele-chat-settings', JSON.stringify(settingsToSave))
      } catch (fallbackError) {
        console.error('Even fallback save failed:', fallbackError)
      }
    }
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.removeItem('miele-chat-settings')
  }

  // Auto-save settings when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        // Comprehensive localStorage cleanup function
        const performStorageCleanup = () => {
          console.log('🧹 Performing localStorage cleanup due to quota issues...')
          
          // 1. Clean up visual content by removing large base64 data
          try {
            const visualContentKey = 'rag_visual_content'
            const visualContent = localStorage.getItem(visualContentKey)
            if (visualContent) {
              const parsed = JSON.parse(visualContent)
              if (Array.isArray(parsed)) {
                const cleaned = parsed.map(item => ({
                  ...item,
                  data: item.data ? { ...item.data, base64: undefined } : undefined,
                  fullContent: undefined // Remove large full content
                }))
                localStorage.setItem(visualContentKey, JSON.stringify(cleaned))
                console.log('✅ Cleaned visual content base64 data')
              }
            }
          } catch (visualError) {
            console.warn('Failed to clean visual content:', visualError)
          }
          
          // 2. Limit chat history to recent messages
          try {
            const chatHistoryKey = 'chat_history'
            const chatHistory = localStorage.getItem(chatHistoryKey)
            if (chatHistory) {
              const parsed = JSON.parse(chatHistory)
              if (Array.isArray(parsed) && parsed.length > 50) {
                const recent = parsed.slice(-50) // Keep only last 50 messages
                localStorage.setItem(chatHistoryKey, JSON.stringify(recent))
                console.log('✅ Trimmed chat history to 50 recent messages')
              }
            }
          } catch (chatError) {
            console.warn('Failed to clean chat history:', chatError)
          }
          
          // 3. Check document storage and remove old embeddings
          try {
            const documentsKey = 'rag_documents'
            const documents = localStorage.getItem(documentsKey)
            if (documents) {
              const parsed = JSON.parse(documents)
              if (Array.isArray(parsed)) {
                const cleaned = parsed.map(doc => ({
                  ...doc,
                  embedding: undefined, // Remove large embedding vectors
                  chunks: doc.chunks?.map((chunk: { id?: string; content?: string; embedding?: unknown }) => ({
                    ...chunk,
                    embedding: undefined // Remove chunk embeddings
                  }))
                }))
                localStorage.setItem(documentsKey, JSON.stringify(cleaned))
                console.log('✅ Removed document embeddings to save space')
              }
            }
          } catch (docError) {
            console.warn('Failed to clean documents:', docError)
          }
        }

        // Pre-emptively check storage and clean if needed
        try {
          const usage = JSON.stringify(localStorage).length
          if (usage > 8 * 1024 * 1024) { // 8MB threshold
            performStorageCleanup()
          }
        } catch {
          // Ignore errors in usage check
        }

        const settingsString = JSON.stringify(settings)
        
        // Check if the settings data is too large (>1MB for settings is excessive)
        if (settingsString.length > 1024 * 1024) {
          console.warn('Settings data unusually large, removing avatarUrl')
          const settingsWithoutAvatar = { ...settings, avatarUrl: null }
          localStorage.setItem('miele-chat-settings', JSON.stringify(settingsWithoutAvatar))
          return
        }
        
        // Try to save settings normally
        const success = StorageManager.safeSetItem('miele-chat-settings', settingsString)
        if (!success) {
          console.warn('⚠️ Failed to save settings even after cleanup - trying minimal settings')
          // Try with minimal settings as final fallback
          const minimalSettings = {
            model: settings.model || 'llama3.1',
            temperature: settings.temperature || 0.7,
            maxTokens: settings.maxTokens || 2000
          }
          StorageManager.safeSetItem('miele-chat-settings', JSON.stringify(minimalSettings))
        }
        
      } catch (error) {
        console.error('Unexpected error saving settings:', error)
        // Last resort fallback
        try {
          const essentialSettings = {
            model: settings.model || 'llama3.1',
            temperature: settings.temperature || 0.7
          }
          StorageManager.safeSetItem('miele-chat-settings', JSON.stringify(essentialSettings))
        } catch (finalError) {
          console.error('Complete failure to save any settings:', finalError)
        }
      }
    }, 500) // Debounce saves

    return () => clearTimeout(timeoutId)
  }, [settings])

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
