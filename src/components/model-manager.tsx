"use client"

import React, { useState, useEffect } from 'react'
import { Download, Check, AlertCircle, RefreshCw, Trash2 } from 'lucide-react'

interface ModelInfo {
  name: string
  displayName: string
  description: string
  size: string
  category: string
  recommended: boolean
  installed: boolean
}

interface ModelManagerProps {
  selectedModel: string
  onModelSelect: (model: string) => void
  className?: string
}

export function ModelManager({ selectedModel, onModelSelect, className = "" }: ModelManagerProps) {
  const [downloadableModels, setDownloadableModels] = useState<ModelInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'installed' | 'available'>('installed')
  const [error, setError] = useState<string | null>(null)

  const fetchModels = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Fetch installed models (we'll use downloadable models endpoint for everything)
      await fetch('/api/models')
      
      // Fetch downloadable models
      const downloadableResponse = await fetch('/api/models/downloadable')
      const downloadableData = await downloadableResponse.json()
      
      if (downloadableData.models) {
        setDownloadableModels(downloadableData.models)
      }
      
    } catch (error) {
      console.error('Error fetching models:', error)
      setError('Failed to fetch models')
    } finally {
      setIsLoading(false)
    }
  }

  const handleModelAction = async (modelName: string, action: 'install' | 'remove') => {
    try {
      const response = await fetch('/api/models/downloadable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, modelName })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Show command to user
        alert(`${data.message}\n\nRun this command in your terminal:\n${data.command}`)
        // Refresh models after a delay
        setTimeout(fetchModels, 2000)
      }
    } catch (error) {
      console.error('Error managing model:', error)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  const installedModels = downloadableModels.filter(m => m.installed)
  const notInstalledModels = downloadableModels.filter(m => !m.installed)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with tabs */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setSelectedTab('installed')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'installed'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Installed ({installedModels.length})
          </button>
          <button
            onClick={() => setSelectedTab('available')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'available'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Available ({notInstalledModels.length})
          </button>
        </div>
        
        <button
          onClick={fetchModels}
          disabled={isLoading}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          title="Refresh models"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
        </div>
      )}

      {/* Current Selection */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-center space-x-2 mb-1">
          <Check className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Current Model
          </span>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-300">{selectedModel}</span>
      </div>

      {/* Model List */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {selectedTab === 'installed' ? (
          installedModels.length > 0 ? (
            installedModels.map((model) => (
              <div
                key={model.name}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedModel === model.name
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                onClick={() => onModelSelect(model.name)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {model.displayName}
                      </span>
                      {model.recommended && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                          Recommended
                        </span>
                      )}
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {model.description}
                    </p>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="text-xs text-gray-500">{model.size}</span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        {model.category}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleModelAction(model.name, 'remove')
                    }}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Remove model"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <Download className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No models installed</p>
              <p className="text-xs">Switch to &ldquo;Available&rdquo; tab to download models</p>
            </div>
          )
        ) : (
          notInstalledModels.map((model) => (
            <div
              key={model.name}
              className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {model.displayName}
                    </span>
                    {model.recommended && (
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {model.description}
                  </p>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className="text-xs text-gray-500">{model.size}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {model.category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleModelAction(model.name, 'install')}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md"
                >
                  <Download className="w-3 h-3" />
                  <span>Install</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Help text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>• Make sure Ollama is running locally</p>
        <p>• Use terminal commands shown to install/remove models</p>
        <p>• Refresh the list after installing new models</p>
      </div>
    </div>
  )
}
