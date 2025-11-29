"use client"

import { useState } from 'react'
import { Settings, Mic, Volume2, Search, X } from 'lucide-react'

interface ChatFeaturesSettings {
  voiceInput: boolean
  voiceOutput: boolean
  onlineSearch: boolean
  autoReadResponses: boolean
}

interface ChatFeaturesSettingsProps {
  settings: ChatFeaturesSettings
  onSettingsChange: (settings: ChatFeaturesSettings) => void
  className?: string
}

export function ChatFeaturesSettings({ settings, onSettingsChange, className = '' }: ChatFeaturesSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const updateSetting = (key: keyof ChatFeaturesSettings, value: boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`${className} p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
        title="Chat Features Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chat Features
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Voice Input */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mic className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Voice Input
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Speak to send messages using speech recognition
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.voiceInput}
                    onChange={(e) => updateSetting('voiceInput', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Voice Output */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Voice Output
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Listen to AI responses using text-to-speech
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.voiceOutput}
                    onChange={(e) => updateSetting('voiceOutput', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Auto-read responses */}
              {settings.voiceOutput && (
                <div className="flex items-center justify-between pl-8">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Auto-read Responses
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Automatically read AI responses aloud
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoReadResponses}
                      onChange={(e) => updateSetting('autoReadResponses', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              )}

              {/* Online Search */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Search className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Online Search
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Search the web using open-source search engines
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.onlineSearch}
                    onChange={(e) => updateSetting('onlineSearch', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Browser Support</h4>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>• Voice Input: Chrome, Edge, Safari (macOS)</p>
                  <p>• Voice Output: All modern browsers</p>
                  <p>• Online Search: SearXNG open-source instances</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Default settings
export const defaultChatFeatures: ChatFeaturesSettings = {
  voiceInput: false,
  voiceOutput: false,
  onlineSearch: true,
  autoReadResponses: false
}

// Hook for using chat features settings
export function useChatFeatures() {
  const [features, setFeatures] = useState<ChatFeaturesSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('miele-chat-features')
      if (saved) {
        try {
          return { ...defaultChatFeatures, ...JSON.parse(saved) }
        } catch {
          return defaultChatFeatures
        }
      }
    }
    return defaultChatFeatures
  })

  const updateFeatures = (newFeatures: ChatFeaturesSettings) => {
    setFeatures(newFeatures)
    if (typeof window !== 'undefined') {
      localStorage.setItem('miele-chat-features', JSON.stringify(newFeatures))
    }
  }

  return [features, updateFeatures] as const
}
