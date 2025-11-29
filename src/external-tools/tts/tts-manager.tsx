/**
 * Text-to-Speech Manager
 * 
 * Manages voice input and output functionality with improved integration
 * Provides unified interface for speech recognition and synthesis
 */

"use client"

import { useState, useCallback } from 'react'
import { Mic, Volume2 } from 'lucide-react'

// Import components
import { VoiceInput } from './voice-input'
import { VoiceOutput } from './voice-output'

interface TTSManagerProps {
  onTranscript?: (text: string) => void
  className?: string
  enableInput?: boolean
  enableOutput?: boolean
  autoPlay?: boolean
}

export function TTSManager({ 
  onTranscript, 
  className = "",
  enableInput = true,
  enableOutput = true,
  autoPlay = false
}: TTSManagerProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentText, setCurrentText] = useState('')
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleTranscript = useCallback((text: string) => {
    setTranscript(text)
    if (onTranscript) {
      onTranscript(text)
    }
  }, [onTranscript])

  const handleVoiceStart = useCallback(() => {
    setIsListening(true)
    setError(null)
  }, [])

  const handleVoiceEnd = useCallback(() => {
    setIsListening(false)
  }, [])

  const handleVoiceError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setIsListening(false)
  }, [])

  const handleSpeakStart = useCallback(() => {
    setIsSpeaking(true)
  }, [])

  const handleSpeakEnd = useCallback(() => {
    setIsSpeaking(false)
  }, [])

  const speakText = useCallback((text: string) => {
    setCurrentText(text)
    if (autoPlay) {
      // Auto-trigger speech synthesis
      setTimeout(() => {
        const event = new CustomEvent('speak-text', { detail: { text } })
        window.dispatchEvent(event)
      }, 100)
    }
  }, [autoPlay])

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 dark:text-white">Voice Controls</h3>
        <div className="flex items-center space-x-2">
          {isListening && (
            <div className="flex items-center space-x-1 text-red-500">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs">Listening...</span>
            </div>
          )}
          {isSpeaking && (
            <div className="flex items-center space-x-1 text-blue-500">
              <Volume2 className="w-3 h-3" />
              <span className="text-xs">Speaking...</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Voice Input Section */}
        {enableInput && (
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Speech Recognition
              </span>
              <div className="flex items-center space-x-1">
                <Mic className="w-4 h-4 text-gray-500" />
              </div>
            </div>
            
            <VoiceInput
              onTranscript={handleTranscript}
              onStart={handleVoiceStart}
              onEnd={handleVoiceEnd}
              onError={handleVoiceError}
              className="w-full"
            />
            
            {transcript && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                <span className="text-gray-600 dark:text-gray-400">Transcript: </span>
                <span className="text-gray-900 dark:text-white">{transcript}</span>
              </div>
            )}
          </div>
        )}

        {/* Voice Output Section */}
        {enableOutput && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Text-to-Speech
              </span>
              <div className="flex items-center space-x-1">
                <Volume2 className="w-4 h-4 text-gray-500" />
              </div>
            </div>
            
            <VoiceOutput
              onStart={handleSpeakStart}
              onEnd={handleSpeakEnd}
              className="w-full"
            />
            
            {currentText && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                <span className="text-blue-600 dark:text-blue-400">Ready to speak: </span>
                <span className="text-gray-900 dark:text-white">{currentText.substring(0, 100)}...</span>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-1 ${isListening ? 'text-red-600' : ''}`}>
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
              <span>Voice Input</span>
            </div>
            <div className={`flex items-center space-x-1 ${isSpeaking ? 'text-blue-600' : ''}`}>
              <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
              <span>Voice Output</span>
            </div>
          </div>
          <div className="text-gray-400">
            {transcript ? `${transcript.split(' ').length} words` : 'Ready'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TTSManager
