/**
 * External Tools Manager
 * 
 * Integrates all external tools (TTS, Online Search, etc.) into the RAG system
 */

"use client"

import { useState } from 'react'
import { Globe, Mic, Volume2, Settings, ExternalLink } from 'lucide-react'
import TTSManager from './tts/tts-manager'
import { OnlineSearch, type SearchResult } from './search/online-search'

interface ExternalToolsManagerProps {
  onSearchResults?: (results: SearchResult[]) => void
  onTranscript?: (text: string) => void
  className?: string
}

export function ExternalToolsManager({ 
  onSearchResults, 
  onTranscript, 
  className = "" 
}: ExternalToolsManagerProps) {
  const [activeTools, setActiveTools] = useState({
    tts: false,
    onlineSearch: false,
    all: false
  })
  
  const [settings, setSettings] = useState({
    enableAutoTTS: false,
    enableSearchIntegration: true,
    voiceLanguage: 'en-US',
    searchProvider: 'google'
  })

  const toggleTool = (tool: keyof typeof activeTools) => {
    setActiveTools(prev => ({
      ...prev,
      [tool]: !prev[tool]
    }))
  }

  const handleWebSearchResults = (results: SearchResult[]) => {
    console.log('🌐 Web search results received:', results.length)
    if (onSearchResults) {
      onSearchResults(results)
    }
  }

  const handleVoiceTranscript = (transcript: string) => {
    console.log('🎤 Voice transcript:', transcript)
    if (onTranscript) {
      onTranscript(transcript)
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ExternalLink className="w-5 h-5 text-blue-500" />
            <h3 className="font-medium text-gray-900 dark:text-white">External Tools</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleTool('all')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                activeTools.all 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {activeTools.all ? 'Disable All' : 'Enable All'}
            </button>
            
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <Settings className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Tool Toggles */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* TTS Toggle */}
          <button
            onClick={() => toggleTool('tts')}
            className={`p-3 rounded-lg border-2 transition-all ${
              activeTools.tts
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Mic className={`w-4 h-4 ${activeTools.tts ? 'text-green-600' : 'text-gray-500'}`} />
              <Volume2 className={`w-4 h-4 ${activeTools.tts ? 'text-green-600' : 'text-gray-500'}`} />
            </div>
            <div className="mt-1">
              <div className={`text-sm font-medium ${activeTools.tts ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                Voice I/O
              </div>
              <div className="text-xs text-gray-500">
                {activeTools.tts ? 'Active' : 'Inactive'}
              </div>
            </div>
          </button>

          {/* Online Search Toggle */}
          <button
            onClick={() => toggleTool('onlineSearch')}
            className={`p-3 rounded-lg border-2 transition-all ${
              activeTools.onlineSearch
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Globe className={`w-4 h-4 ${activeTools.onlineSearch ? 'text-blue-600' : 'text-gray-500'}`} />
            </div>
            <div className="mt-1">
              <div className={`text-sm font-medium ${activeTools.onlineSearch ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                Web Search
              </div>
              <div className="text-xs text-gray-500">
                {activeTools.onlineSearch ? 'Active' : 'Inactive'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Active Tools */}
      <div className="space-y-4">
        {activeTools.tts && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <TTSManager
              onTranscript={handleVoiceTranscript}
              enableInput={true}
              enableOutput={true}
              autoPlay={settings.enableAutoTTS}
            />
          </div>
        )}

        {activeTools.onlineSearch && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <OnlineSearch
              onResults={handleWebSearchResults}
              isEnabled={settings.enableSearchIntegration}
              provider={settings.searchProvider}
            />
          </div>
        )}
      </div>

      {/* Settings Panel */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Auto TTS</span>
            <button
              onClick={() => setSettings(prev => ({ ...prev, enableAutoTTS: !prev.enableAutoTTS }))}
              className={`w-8 h-4 rounded-full transition-colors ${
                settings.enableAutoTTS ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                settings.enableAutoTTS ? 'translate-x-4' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Search Integration</span>
            <button
              onClick={() => setSettings(prev => ({ ...prev, enableSearchIntegration: !prev.enableSearchIntegration }))}
              className={`w-8 h-4 rounded-full transition-colors ${
                settings.enableSearchIntegration ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                settings.enableSearchIntegration ? 'translate-x-4' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          External tools extend RAG capabilities with web search and voice interaction
        </div>
      </div>
    </div>
  )
}

export default ExternalToolsManager
