"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ollamaService, formatBytes, getModelDescription, getModelCapabilities, isRecommendedModel } from '@/services/ollama-service'

export interface AISettings {
  summarizationModel: string
  keywordExtractionModel: string
  embeddingModel: string
  temperature: number
  maxTokens: number
  enableAISummarization: boolean
  enableKeywordExtraction: boolean
  enableDomainDetection: boolean
  domainSpecificPrompts: boolean
  useUnifiedPrompt: boolean
  validationLevel: 'basic' | 'standard' | 'strict'
  retryAttempts: number
  enableFallback: boolean
}

export interface AvailableModel {
  name: string
  size: string
  description: string
  capabilities: string[]
  recommended: boolean
}

interface AISettingsContextType {
  settings: AISettings
  availableModels: AvailableModel[]
  updateSettings: (settings: Partial<AISettings>) => void
  resetSettings: () => void
  isLoading: boolean
  error: string | null
}

const defaultSettings: AISettings = {
  summarizationModel: 'llama3:latest',
  keywordExtractionModel: 'llama3:latest',
  embeddingModel: 'llama3:latest',
  temperature: 0.3,
  maxTokens: 2000,
  enableAISummarization: true,
  enableKeywordExtraction: true,
  enableDomainDetection: true,
  domainSpecificPrompts: false, // Deprecated: use unified prompt instead
  useUnifiedPrompt: true, // Primary prompt system
  validationLevel: 'standard',
  retryAttempts: 3,
  enableFallback: true
}

const AISettingsContext = createContext<AISettingsContextType | undefined>(undefined)

export function useAISettings() {
  const context = useContext(AISettingsContext)
  if (context === undefined) {
    throw new Error('useAISettings must be used within an AISettingsProvider')
  }
  return context
}

interface AISettingsProviderProps {
  children: ReactNode
}

export function AISettingsProvider({ children }: AISettingsProviderProps) {
  const [settings, setSettings] = useState<AISettings>(defaultSettings)
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('miele-ai-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error)
      setError('Failed to load AI settings')
    }
  }, [])

  // Fetch available models from Ollama
  useEffect(() => {
    fetchAvailableModels()
  }, [])

  const fetchAvailableModels = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await ollamaService.fetchModels(true) // Force refresh
      
      if (response.success && response.data) {
        const models: AvailableModel[] = response.data.map((model) => ({
          name: model.name,
          size: formatBytes(model.size || 0),
          description: getModelDescription(model.name),
          capabilities: getModelCapabilities(model.name),
          recommended: isRecommendedModel(model.name)
        }))
        
        setAvailableModels(models)
      } else {
        console.warn('No models available from Ollama service:', response.error)
        
        // Fallback to default models if Ollama is not available
        setAvailableModels([
          {
            name: 'llama3.2:3b',
            size: '2.0GB',
            description: 'Llama 3.2 3B - fast and efficient for general tasks',
            capabilities: ['text generation', 'summarization', 'analysis'],
            recommended: true
          },
          {
            name: 'mistral:7b',
            size: '4.1GB',
            description: 'Mistral AI model - fast and efficient',
            capabilities: ['text generation', 'code analysis', 'summarization'],
            recommended: true
          },
          {
            name: 'codellama:7b',
            size: '3.8GB',
            description: 'Code Llama - specialized for code analysis',
            capabilities: ['code generation', 'code analysis', 'technical documentation'],
            recommended: false
          }
        ])
      }
    } catch (error) {
      console.error('Failed to fetch available models:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      
      // Fallback to default models if Ollama is not available
      setAvailableModels([
        {
          name: 'llama3.2:3b',
          size: '2.0GB',
          description: 'Llama 3.2 3B - fast and efficient for general tasks',
          capabilities: ['text generation', 'summarization', 'analysis'],
          recommended: true
        },
        {
          name: 'mistral:7b',
          size: '4.1GB',
          description: 'Mistral AI model - fast and efficient',
          capabilities: ['text generation', 'code analysis', 'summarization'],
          recommended: true
        },
        {
          name: 'codellama:7b',
          size: '3.8GB',
          description: 'Code Llama - specialized for code analysis',
          capabilities: ['code generation', 'code analysis', 'technical documentation'],
          recommended: false
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const updateSettings = (newSettings: Partial<AISettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    
    try {
      localStorage.setItem('miele-ai-settings', JSON.stringify(updatedSettings))
    } catch (error) {
      console.error('Failed to save AI settings:', error)
      setError('Failed to save AI settings')
    }
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.removeItem('miele-ai-settings')
  }

  return (
    <AISettingsContext.Provider
      value={{
        settings,
        availableModels,
        updateSettings,
        resetSettings,
        isLoading,
        error
      }}
    >
      {children}
    </AISettingsContext.Provider>
  )
}

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function getModelDescription(name: string): string {
  const modelDescriptions: Record<string, string> = {
    'llama3:latest': 'Meta\'s Llama 3 model - excellent for general tasks and summarization',
    'llama3:8b': 'Llama 3 8B - balanced performance and speed',
    'llama3:70b': 'Llama 3 70B - high-quality responses for complex tasks',
    'mistral:latest': 'Mistral AI model - fast and efficient for most tasks',
    'mistral:7b': 'Mistral 7B - lightweight and fast',
    'gpt-oss': 'Open-source GPT model - good alternative for analysis tasks',
    'gpt-oss:20b': 'Large open-source model for complex analysis tasks',
    'openhermes:latest': 'OpenHermes model - good for conversational tasks',
    'deepseek-coder:latest': 'DeepSeek Coder - specialized for code analysis',
    'codellama:latest': 'Code Llama - Meta\'s code-focused model',
    'phi3:latest': 'Microsoft Phi-3 - compact but capable model',
  }
  
  return modelDescriptions[name] || 'AI language model for text processing'
}

function getModelCapabilities(name: string): string[] {
  const baseCapabilities = ['text generation', 'summarization', 'analysis']
  
  if (name.includes('coder') || name.includes('code')) {
    return [...baseCapabilities, 'code analysis', 'technical documentation']
  }
  
  if (name.includes('llama3:70b') || name.includes('gpt-oss')) {
    return [...baseCapabilities, 'complex reasoning', 'detailed analysis', 'domain expertise']
  }
  
  if (name.includes('mistral')) {
    return [...baseCapabilities, 'fast processing', 'efficient analysis']
  }
  
  return baseCapabilities
}

function isRecommendedModel(name: string): boolean {
  const recommendedModels = [
    'llama3:latest',
    'llama3:8b',
    'mistral:latest',
    'mistral:7b',
    'gpt-oss'
  ]
  
  return recommendedModels.includes(name)
}
