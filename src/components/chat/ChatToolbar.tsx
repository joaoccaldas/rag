/**
 * Chat Toolbar Component
 * Provides action buttons for chat functionality
 */

import React from 'react'
import { Search, Volume2, Upload } from 'lucide-react'
import { VoiceControls } from '../voice-controls'
import { OnlineSearch } from '../online-search'
import { ChatFeaturesSettings } from '../chat-features-settings'

interface SearchResult {
  title: string
  content: string
  url: string
  engine: string
}

type ChatFeatures = {
  voiceInput: boolean
  voiceOutput: boolean
  onlineSearch: boolean
  autoReadResponses: boolean
}

interface ChatToolbarProps {
  chatFeatures: ChatFeatures
  onChatFeaturesChange: (features: ChatFeatures) => void
  onVoiceInput: (transcript: string) => void
  onSearchResults: (results: SearchResult[]) => void
  onTextToSpeech: (text: string) => void
  onFileUpload: () => void
  isLoading: boolean
  className?: string
}

export function ChatToolbar({
  chatFeatures,
  onChatFeaturesChange,
  onVoiceInput,
  onSearchResults,
  onTextToSpeech,
  onFileUpload,
  isLoading,
  className = ""
}: ChatToolbarProps) {
  const [showSearchModal, setShowSearchModal] = React.useState(false)

  const handleSearchClick = () => {
    setShowSearchModal(true)
  }

  const handleSearchResults = (results: SearchResult[]) => {
    onSearchResults(results)
    setShowSearchModal(false)
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Voice Input */}
      {chatFeatures.voiceInput && (
        <div className="relative group">
          <VoiceControls
            onVoiceInput={onVoiceInput}
            disabled={isLoading || !chatFeatures.voiceInput}
            className="h-9 w-9"
          />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Voice Input
          </div>
        </div>
      )}

      {/* Online Search */}
      {chatFeatures.onlineSearch && (
        <div className="relative group">
          <button
            onClick={handleSearchClick}
            className="h-9 w-9 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
            disabled={isLoading}
            title="Search Online"
          >
            <Search className="w-4 h-4" />
          </button>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Online Search
          </div>
        </div>
      )}

      {/* Text to Speech */}
      {chatFeatures.voiceOutput && (
        <div className="relative group">
          <button
            onClick={() => {
              const lastBotMessage = document.querySelector('[data-message-type="bot"]:last-child .message-content')
              if (lastBotMessage) {
                onTextToSpeech(lastBotMessage.textContent || '')
              }
            }}
            className="h-9 w-9 flex items-center justify-center text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
            disabled={isLoading}
            title="Read Last Message"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Text to Speech
          </div>
        </div>
      )}

      {/* File Upload */}
      <div className="relative group">
        <button
          onClick={onFileUpload}
          className="h-9 w-9 flex items-center justify-center text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors disabled:opacity-50"
          disabled={isLoading}
          title="Upload File"
        >
          <Upload className="w-4 h-4" />
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Upload File
        </div>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

      {/* Chat Settings */}
      <div className="relative group">
        <ChatFeaturesSettings
          settings={chatFeatures}
          onSettingsChange={onChatFeaturesChange}
        />
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Chat Settings
        </div>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Online Search</h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <OnlineSearch
                isEnabled={chatFeatures.onlineSearch}
                onResults={handleSearchResults}
                className=""
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

