"use client"

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { X, Settings, Save, Upload, Bot } from 'lucide-react'
import { useSettings, ChatSettings } from '@/contexts/SettingsContext'
import { ModelManager } from './model-manager'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings, saveSettings } = useSettings()
  const [localSettings, setLocalSettings] = useState<ChatSettings>(settings)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB.')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setLocalSettings(prev => ({ ...prev, avatarUrl: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setLocalSettings(prev => ({ ...prev, avatarUrl: null }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = () => {
    updateSettings(localSettings)
    saveSettings()
    onClose()
  }

  const handleReset = () => {
    resetSettings()
    setLocalSettings(settings)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Chat Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assistant Avatar
            </label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center">
                  {localSettings.avatarUrl ? (
                    <Image 
                      src={localSettings.avatarUrl} 
                      alt="Assistant Avatar" 
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Bot className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 text-sm flex items-center space-x-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload Image</span>
                </button>
                {localSettings.avatarUrl && (
                  <button
                    onClick={removeAvatar}
                    className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Upload a custom avatar for your AI assistant (max 5MB)
            </p>
          </div>

          {/* Personality Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Personality Description
            </label>
            <textarea
              value={localSettings.personalityDescription}
              onChange={(e) => setLocalSettings({ ...localSettings, personalityDescription: e.target.value })}
              rows={3}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Describe how you want your AI assistant to behave and respond..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This description will influence how the AI assistant responds to your messages
            </p>
          </div>

          {/* Chat Personalization */}
          <div className="space-y-4 p-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Chat Personalization</h3>
            
            {/* User Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={localSettings.userName}
                onChange={(e) => setLocalSettings({ ...localSettings, userName: e.target.value })}
                placeholder="e.g., John Smith"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                The assistant will use this name when addressing you
              </p>
            </div>

            {/* Bot Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assistant Name
              </label>
              <input
                type="text"
                value={localSettings.botName}
                onChange={(e) => setLocalSettings({ ...localSettings, botName: e.target.value })}
                placeholder="e.g., Miele Assistant"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                The name your assistant will use to identify itself
              </p>
            </div>

            {/* Bot Name Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assistant Name Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={localSettings.botNameColor || '#3b82f6'}
                  onChange={(e) => setLocalSettings({ ...localSettings, botNameColor: e.target.value })}
                  className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                />
                <input
                  type="text"
                  value={localSettings.botNameColor || '#3b82f6'}
                  onChange={(e) => setLocalSettings({ ...localSettings, botNameColor: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Choose the color for your assistant&apos;s name in the chat header
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Preview:</span>
                <span 
                  style={{ color: localSettings.botNameColor || '#3b82f6' }}
                  className="font-medium"
                >
                  {localSettings.botName || 'Miele Assistant'}
                </span>
              </div>
            </div>

            {/* Welcome Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Welcome Message
              </label>
              <textarea
                value={localSettings.welcomeMessage}
                onChange={(e) => setLocalSettings({ ...localSettings, welcomeMessage: e.target.value })}
                rows={3}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter the welcome message your assistant will display when starting a new chat..."
              />
              <p className="text-xs text-gray-500 mt-1">
                This message will be shown when users start a new conversation
              </p>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI Model Management
            </label>
            
            {/* Local Model Toggle */}
            <div className="mb-4 p-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localSettings.useLocalModel}
                    onChange={(e) => setLocalSettings({ ...localSettings, useLocalModel: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Use Local GGUF Model
                  </span>
                </label>
                <div className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                  Beta
                </div>
              </div>
              
              {localSettings.useLocalModel && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Model File Path (optional)
                    </label>
                    <input
                      type="text"
                      value={localSettings.localModelPath || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, localModelPath: e.target.value })}
                      placeholder="e.g., my-model.gguf (leave empty for auto-detection)"
                      className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Place .gguf files in the models/ directory. If empty, first .gguf file will be used.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-xs">
                    <p className="text-blue-800 dark:text-blue-200">
                      <strong>Local Model Benefits:</strong> Privacy-focused, no internet required, supports CUDA/Metal/Vulkan acceleration.
                      Falls back to Ollama if local model fails.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {!localSettings.useLocalModel && (
              <ModelManager
                selectedModel={localSettings.model}
                onModelSelect={(model) => setLocalSettings({ ...localSettings, model })}
                className="border border-gray-300 dark:border-gray-600 rounded-md p-4 bg-white dark:bg-gray-700"
              />
            )}
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              System Prompt
            </label>
            <textarea
              value={localSettings.systemPrompt}
              onChange={(e) => setLocalSettings({ ...localSettings, systemPrompt: e.target.value })}
              rows={4}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Define the AI's role and behavior..."
            />
          </div>

          {/* Personality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Personality
            </label>
            <select
              value={localSettings.personality}
              onChange={(e) => setLocalSettings({ ...localSettings, personality: e.target.value as ChatSettings['personality'] })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="technical">Technical</option>
              <option value="casual">Casual</option>
            </select>
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Response Style
            </label>
            <select
              value={localSettings.style}
              onChange={(e) => setLocalSettings({ ...localSettings, style: e.target.value as ChatSettings['style'] })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="concise">Concise</option>
              <option value="detailed">Detailed</option>
              <option value="brief">Brief</option>
            </select>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Temperature: {localSettings.temperature || 0.7}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={localSettings.temperature || 0.7}
              onChange={(e) => setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) || 0.7 })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Conservative</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Tokens
            </label>
            <input
              type="number"
              min="100"
              max="4000"
              step="100"
              value={localSettings.maxTokens || 1000}
              onChange={(e) => setLocalSettings({ ...localSettings, maxTokens: parseInt(e.target.value) || 1000 })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Verbose Mode */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="verbose"
              checked={localSettings.verbose}
              onChange={(e) => setLocalSettings({ ...localSettings, verbose: e.target.checked })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="verbose" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Verbose Mode (Include reasoning and thought process)
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Reset to Defaults
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
