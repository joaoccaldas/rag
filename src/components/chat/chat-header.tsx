"use client"

import React, { memo, useState, useEffect } from 'react'
import { Settings, Wifi, WifiOff, AlertCircle, Database, Users, ChevronDown, Check } from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'

interface ConnectionStatus {
  connected: boolean
  model: string
  loading: boolean
  error?: string
}

interface ModelData {
  name: string
  size: number
}

interface SimpleModelSelectorProps {
  selectedModel: string
  onModelSelect: (model: string) => void
  className?: string
}

const SimpleModelSelector = ({ selectedModel, onModelSelect, className = '' }: SimpleModelSelectorProps) => {
  const [models, setModels] = useState<ModelData[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Fallback models if API is unavailable
  const fallbackModels: ModelData[] = [
    { name: 'gpt-oss:20b', size: 13780173734 },
    { name: 'llama3.1:8b', size: 4661224448 },
    { name: 'llama3.1:70b', size: 39968020480 },
    { name: 'mistral:7b', size: 4109592064 }
  ]

  useEffect(() => {
    const fetchModels = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/models')
        if (response.ok) {
          const data = await response.json()
          if (data.chatModels && data.chatModels.length > 0) {
            setModels(data.chatModels)
          } else {
            // Use fallback models if no models returned
            console.warn('No chat models returned from API, using fallback models')
            setModels(fallbackModels)
          }
        } else {
          // API returned error, use fallback
          console.warn('API returned error, using fallback models')
          setModels(fallbackModels)
        }
      } catch (error) {
        console.error('Failed to fetch models:', error)
        setModels(fallbackModels)
      } finally {
        setIsLoading(false)
      }
    }

    fetchModels()
  }, []) // fallbackModels is stable, no need to include in deps

  const getDisplayName = (model: ModelData | string) => {
    if (typeof model === 'string') {
      // Handle selected model (string format)
      const modelData = models.find(m => m.name === model)
      if (modelData) {
        return `${modelData.name} (${(modelData.size / 1024 / 1024 / 1024).toFixed(1)}GB)`
      }
      return model
    }
    // Handle model object
    return `${model.name} (${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)`
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground truncate">
            {selectedModel ? getDisplayName(selectedModel) : 'Select AI Model'}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">
            {selectedModel ? 'Click to change model' : 'Choose from available models'}
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ml-2 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Loading models...</div>
          ) : models.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">No models available</div>
          ) : (
            models.map((model) => (
              <button
                key={model.name}
                onClick={() => {
                  onModelSelect(model.name)
                  setIsOpen(false)
                }}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground truncate">
                    {model.name}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {(model.size / 1024 / 1024 / 1024).toFixed(1)}GB • 
                    {selectedModel === model.name ? ' Currently selected' : ' Available'}
                  </span>
                </div>
                {selectedModel === model.name && (
                  <Check className="w-4 h-4 text-emerald-600 ml-2 flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface ConnectionStatus {
  connected: boolean
  model: string
  loading: boolean
  error?: string
}

interface ChatHeaderProps {
  connectionStatus: ConnectionStatus
  onSettingsClick: () => void
  isRagEnabled?: boolean
  onRagToggle?: (enabled: boolean) => void
  activeUsers?: number
  className?: string
}

const ChatHeaderComponent = ({
  connectionStatus,
  onSettingsClick,
  isRagEnabled = false,
  onRagToggle,
  activeUsers = 1,
  className = ''
}: ChatHeaderProps) => {
  const { settings, updateSettings } = useSettings()
  
  const getStatusIcon = () => {
    if (connectionStatus.loading) {
      return <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
    }
    
    if (connectionStatus.error) {
      return <AlertCircle className="w-4 h-4 text-red-500" />
    }
    
    return connectionStatus.connected 
      ? <Wifi className="w-4 h-4 text-green-500" />
      : <WifiOff className="w-4 h-4 text-red-500" />
  }

  const getStatusText = () => {
    if (connectionStatus.loading) return "Connecting..."
    if (connectionStatus.error) return connectionStatus.error
    if (connectionStatus.connected) return `Connected to ${connectionStatus.model}`
    return "Disconnected"
  }

  const getStatusColor = () => {
    if (connectionStatus.loading) return "text-blue-600 dark:text-blue-400"
    if (connectionStatus.error) return "text-red-600 dark:text-red-400"
    return connectionStatus.connected 
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400"
  }

  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${className}`}>
      <div className="flex items-center justify-between p-6 gap-6">
        {/* Left Section - Title and Status */}
        <div className="flex items-center gap-6 min-w-0 flex-shrink-0">
          <div className="min-w-0">
            <h1 
              className="text-xl font-bold truncate mb-1"
              style={{ color: settings.botNameColor || '#3b82f6' }}
            >
              {settings.botName || 'Miele AI Assistant'}
            </h1>
            <div className={`flex items-center gap-3 text-sm ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="font-medium">{getStatusText()}</span>
            </div>
          </div>

          {/* Features Indicators */}
          <div className="hidden lg:flex items-center gap-3">
            {isRagEnabled && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium border border-emerald-200 dark:border-emerald-700">
                <Database className="w-4 h-4" />
                <span>RAG Active</span>
              </div>
            )}
            
            {activeUsers > 1 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-700">
                <Users className="w-4 h-4" />
                <span>{activeUsers} online</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Model Selector */}
          <div className="min-w-0 max-w-xs hidden md:block">
            <SimpleModelSelector 
              selectedModel={settings.model}
              onModelSelect={(model) => {
                console.log('🔧 Model selected in UI:', model)
                updateSettings({ model })
                // Sync model selection across contexts
                try {
                  import('@/utils/model-sync').then(({ syncModelSelection }) => {
                    syncModelSelection(model)
                  })
                } catch (error) {
                  console.error('Failed to sync model selection:', error)
                }
              }}
              className="w-full"
            />
          </div>

          {/* RAG Toggle */}
          {onRagToggle && (
            <button
              onClick={() => onRagToggle(!isRagEnabled)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                isRagEnabled 
                  ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 shadow-md' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={`${isRagEnabled ? 'Disable' : 'Enable'} RAG`}
            >
              <Database className="w-4 h-4 mr-2 inline" />
              RAG {isRagEnabled ? 'ON' : 'OFF'}
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 border border-gray-300 dark:border-gray-600"
            title="Chat settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Model Selector */}
      <div className="md:hidden px-4 pb-3">
        <SimpleModelSelector 
          selectedModel={settings.model}
          onModelSelect={(model) => {
            console.log('🔧 Model selected in UI (compact):', model)
            updateSettings({ model })
            // Sync model selection across contexts
            try {
              import('@/utils/model-sync').then(({ syncModelSelection }) => {
                syncModelSelection(model)
              })
            } catch (error) {
              console.error('Failed to sync model selection:', error)
            }
          }}
          className="w-full"
        />
      </div>

      {/* Mobile Features Indicators */}
      <div className="lg:hidden flex items-center gap-2 px-4 pb-3">
        {isRagEnabled && (
          <div className="flex items-center gap-1 px-3 py-1.5 bg-success/10 text-success rounded-full text-label-medium">
            <Database className="w-3 h-3" />
            <span>RAG Active</span>
          </div>
        )}
        
        {activeUsers > 1 && (
          <div className="flex items-center gap-1 px-3 py-1.5 bg-info/10 text-info rounded-full text-label-medium">
            <Users className="w-3 h-3" />
            <span>{activeUsers} online</span>
          </div>
        )}
      </div>

      {/* Connection Error Alert */}
      {connectionStatus.error && (
        <div className="px-4 pb-3">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-destructive text-body-small">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Connection Issue</span>
            </div>
            <p className="text-destructive text-body-small mt-1">
              {connectionStatus.error}
            </p>
            <p className="text-destructive text-caption mt-1">
              Please check your Ollama connection and try again.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

ChatHeaderComponent.displayName = 'ChatHeader'

export const ChatHeader = memo(ChatHeaderComponent)
