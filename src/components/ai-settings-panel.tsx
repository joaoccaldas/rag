"use client"

import React, { useState } from 'react'
import { Brain, Settings, RotateCcw, AlertTriangle, CheckCircle, Loader2, Edit } from 'lucide-react'
import { useAISettings } from '@/contexts/AISettingsContext'
import { PromptTemplateManager } from './prompt-template-manager'

export function AISettingsPanel() {
  const { settings, availableModels, updateSettings, resetSettings, isLoading, error } = useAISettings()
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showPromptManager, setShowPromptManager] = useState(false)

  const handleSettingChange = (key: keyof typeof settings, value: string | number | boolean) => {
    updateSettings({ [key]: value })
    
    // Show save success message
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    }, 500)
  }

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all AI settings to defaults?')) {
      resetSettings()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }

  const getModelBadgeColor = (model: string) => {
    const found = availableModels.find(m => m.name === model)
    if (!found) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
    if (found.recommended) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            AI Configuration
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Configure AI models and settings for document analysis and summarization.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {isSaving && (
            <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Saving...</span>
            </div>
          )}
          
          {saveSuccess && (
            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Saved!</span>
            </div>
          )}
          
          <button
            onClick={handleResetSettings}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Model Configuration */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Brain className="w-4 h-4" />
          <span>Model Selection</span>
        </h4>
        
        <div className="space-y-6">
          {/* Summarization Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Summarization Model
            </label>
            <select
              value={settings.summarizationModel}
              onChange={(e) => handleSettingChange('summarizationModel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              {availableModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name} ({model.size})
                  {model.recommended ? ' - Recommended' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Model used for generating document summaries and semantic analysis
            </p>
          </div>

          {/* Keyword Extraction Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Keyword Extraction Model
            </label>
            <select
              value={settings.keywordExtractionModel}
              onChange={(e) => handleSettingChange('keywordExtractionModel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              {availableModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name} ({model.size})
                  {model.recommended ? ' - Recommended' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Model used for extracting keywords and semantic tags
            </p>
          </div>
        </div>
      </div>

      {/* Generation Parameters */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Settings className="w-4 h-4" />
          <span>Generation Parameters</span>
        </h4>
        
        <div className="space-y-6">
          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Temperature: {settings.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Conservative (0.0)</span>
              <span>Balanced (0.5)</span>
              <span>Creative (1.0)</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Lower values make output more focused and deterministic
            </p>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Tokens
            </label>
            <select
              value={settings.maxTokens}
              onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1000}>1,000 tokens (Short summaries)</option>
              <option value={2000}>2,000 tokens (Detailed summaries)</option>
              <option value={4000}>4,000 tokens (Comprehensive analysis)</option>
              <option value={8000}>8,000 tokens (In-depth analysis)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maximum number of tokens to generate for each summary
            </p>
          </div>

          {/* Validation Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Validation Level
            </label>
            <select
              value={settings.validationLevel}
              onChange={(e) => handleSettingChange('validationLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="basic">Basic - Fast processing, minimal validation</option>
              <option value="standard">Standard - Balanced quality and speed</option>
              <option value="strict">Strict - Thorough validation, slower processing</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Level of quality validation applied to AI-generated summaries
            </p>
          </div>

          {/* Retry Attempts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Retry Attempts
            </label>
            <select
              value={settings.retryAttempts}
              onChange={(e) => handleSettingChange('retryAttempts', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>1 attempt (Fast, no retries)</option>
              <option value={2}>2 attempts (One retry on failure)</option>
              <option value={3}>3 attempts (Two retries, recommended)</option>
              <option value={5}>5 attempts (Maximum reliability)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Number of retry attempts if AI processing fails
            </p>
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          Feature Configuration
        </h4>
        
        <div className="space-y-4">
          {/* AI Summarization */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700 dark:text-gray-300">
                AI Summarization
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Generate AI-powered summaries for uploaded documents
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableAISummarization}
                onChange={(e) => handleSettingChange('enableAISummarization', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Keyword Extraction */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700 dark:text-gray-300">
                Keyword Extraction
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Extract semantic keywords and tags from documents
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableKeywordExtraction}
                onChange={(e) => handleSettingChange('enableKeywordExtraction', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Domain Detection */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700 dark:text-gray-300">
                Domain-Specific Analysis
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use specialized prompts based on document domain (business, technical, etc.)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.domainSpecificPrompts}
                onChange={(e) => handleSettingChange('domainSpecificPrompts', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Fallback Mode */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700 dark:text-gray-300">
                Fallback Mode
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use rule-based analysis if AI processing fails
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableFallback}
                onChange={(e) => handleSettingChange('enableFallback', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Available Models Info */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Available Models
          </h4>
          <button
            onClick={() => setShowPromptManager(true)}
            className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
          >
            <Edit className="w-4 h-4" />
            <span>Manage Prompts</span>
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading models...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {availableModels.map((model) => (
              <div
                key={model.name}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {model.name}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getModelBadgeColor(model.name)}`}>
                      {model.size}
                    </span>
                    {model.recommended && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {model.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {model.capabilities.map((capability) => (
                      <span
                        key={capability}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prompt Template Manager Modal */}
      <PromptTemplateManager 
        isOpen={showPromptManager}
        onClose={() => setShowPromptManager(false)}
      />
    </div>
  )
}
