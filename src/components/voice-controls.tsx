"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Play, Pause, RotateCcw, Settings } from 'lucide-react'

// TypeScript interface for Speech Recognition API
interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((ev: Event) => void) | null
  onend: ((ev: Event) => void) | null
  onresult: ((ev: SpeechRecognitionEvent) => void) | null
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface VoiceControlsProps {
  onVoiceInput?: (text: string) => void
  onSpeechStart?: () => void
  onSpeechEnd?: () => void
  disabled?: boolean
  className?: string
}

export function VoiceControls({
  onVoiceInput,
  onSpeechStart,
  onSpeechEnd,
  disabled = false,
  className = ''
}: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  
  // Voice settings
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 0.9,
    pitch: 1.0,
    volume: 0.8,
    voice: 'default',
    language: 'en-US',
    continuous: false,
    interimResults: true
  })

  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const availableVoicesRef = useRef<SpeechSynthesisVoice[]>([])

  // Initialize speech APIs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for speech recognition support
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (SpeechRecognitionConstructor) {
        recognitionRef.current = new SpeechRecognitionConstructor() as ISpeechRecognition
        const recognition = recognitionRef.current
        
        recognition.continuous = voiceSettings.continuous
        recognition.interimResults = voiceSettings.interimResults
        recognition.lang = voiceSettings.language
        
        recognition.onstart = () => {
          setIsListening(true)
          onSpeechStart?.()
        }
        
        recognition.onresult = (event) => {
          let finalTranscript = ''
          let interimTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              finalTranscript += result[0].transcript
              setConfidence(result[0].confidence * 100)
            } else {
              interimTranscript += result[0].transcript
            }
          }
          
          if (finalTranscript) {
            setTranscript(finalTranscript)
            onVoiceInput?.(finalTranscript)
          } else {
            setTranscript(interimTranscript)
          }
        }
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          onSpeechEnd?.()
        }
        
        recognition.onend = () => {
          setIsListening(false)
          onSpeechEnd?.()
        }
      }
      
      // Check for speech synthesis support
      if (window.speechSynthesis) {
        synthRef.current = window.speechSynthesis
        setIsSupported(true)
        
        // Load available voices
        const loadVoices = () => {
          availableVoicesRef.current = synthRef.current?.getVoices() || []
        }
        
        loadVoices()
        if (synthRef.current.onvoiceschanged !== undefined) {
          synthRef.current.onvoiceschanged = loadVoices
        }
      }
    }
  }, [voiceSettings.continuous, voiceSettings.interimResults, voiceSettings.language, onSpeechStart, onSpeechEnd, onVoiceInput])

  // Start voice recognition
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !disabled) {
      setTranscript('')
      setConfidence(0)
      recognitionRef.current.start()
    }
  }, [isListening, disabled])

  // Stop voice recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  // Speak text
  const speak = useCallback((text: string) => {
    if (synthRef.current && !isSpeaking && text.trim()) {
      // Cancel any ongoing speech
      synthRef.current.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = voiceSettings.rate
      utterance.pitch = voiceSettings.pitch
      utterance.volume = voiceSettings.volume
      
      // Set voice if not default
      if (voiceSettings.voice !== 'default') {
        const selectedVoice = availableVoicesRef.current.find(
          voice => voice.name === voiceSettings.voice
        )
        if (selectedVoice) {
          utterance.voice = selectedVoice
        }
      }
      
      utterance.onstart = () => {
        setIsSpeaking(true)
        setIsPaused(false)
        onSpeechStart?.()
      }
      
      utterance.onend = () => {
        setIsSpeaking(false)
        setIsPaused(false)
        onSpeechEnd?.()
      }
      
      utterance.onerror = () => {
        setIsSpeaking(false)
        setIsPaused(false)
        onSpeechEnd?.()
      }
      
      currentUtteranceRef.current = utterance
      synthRef.current.speak(utterance)
    }
  }, [isSpeaking, voiceSettings, onSpeechStart, onSpeechEnd])

  // Pause/Resume speech
  const toggleSpeech = useCallback(() => {
    if (synthRef.current && isSpeaking) {
      if (isPaused) {
        synthRef.current.resume()
        setIsPaused(false)
      } else {
        synthRef.current.pause()
        setIsPaused(true)
      }
    }
  }, [isSpeaking, isPaused])

  // Stop speech
  const stopSpeaking = useCallback(() => {
    if (synthRef.current && (isSpeaking || isPaused)) {
      synthRef.current.cancel()
      setIsSpeaking(false)
      setIsPaused(false)
      onSpeechEnd?.()
    }
  }, [isSpeaking, isPaused, onSpeechEnd])

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setConfidence(0)
  }, [])

  // Update voice settings
  const updateSettings = useCallback((newSettings: Partial<typeof voiceSettings>) => {
    setVoiceSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  if (!isSupported) {
    return (
      <div className={`text-center p-4 text-gray-500 dark:text-gray-400 ${className}`}>
        <MicOff className="w-6 h-6 mx-auto mb-2" />
        <p className="text-sm">Voice features not supported in this browser</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-3">
        {/* Voice Input */}
        <div className="flex items-center space-x-2">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={disabled || isSpeaking}
            className={`p-3 rounded-full border-2 transition-all duration-200 ${
              isListening
                ? 'bg-red-500 border-red-500 text-white shadow-lg scale-105'
                : disabled || isSpeaking
                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                : 'bg-white border-blue-500 text-blue-500 hover:bg-blue-50 hover:scale-105'
            }`}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          {transcript && (
            <button
              onClick={resetTranscript}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                       transition-colors"
              title="Clear transcript"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Voice Output */}
        {(isSpeaking || isPaused) && (
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleSpeech}
              className={`p-3 rounded-full border-2 transition-all ${
                isPaused
                  ? 'bg-yellow-500 border-yellow-500 text-white'
                  : 'bg-green-500 border-green-500 text-white'
              }`}
              title={isPaused ? 'Resume speech' : 'Pause speech'}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
            
            <button
              onClick={stopSpeaking}
              className="p-3 rounded-full border-2 bg-red-500 border-red-500 text-white 
                       hover:bg-red-600 transition-colors"
              title="Stop speech"
            >
              <VolumeX className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Settings */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                   transition-colors"
          title="Voice settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center justify-center space-x-4 text-sm">
        {isListening && (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>Listening...</span>
          </div>
        )}
        
        {isSpeaking && (
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <Volume2 className="w-4 h-4" />
            <span>{isPaused ? 'Paused' : 'Speaking...'}</span>
          </div>
        )}
        
        {confidence > 0 && (
          <div className="text-gray-600 dark:text-gray-400">
            Confidence: {Math.round(confidence)}%
          </div>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Voice Input
            </span>
            <button
              onClick={() => speak(transcript)}
              disabled={isSpeaking}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
            >
              Repeat
            </button>
          </div>
          <p className="text-gray-900 dark:text-white text-sm">
            {transcript}
          </p>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                      rounded-lg space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Voice Settings</h4>
          
          {/* Speech Rate */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Speech Rate: {voiceSettings.rate}
            </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={voiceSettings.rate}
              onChange={(e) => updateSettings({ rate: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          
          {/* Speech Pitch */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Speech Pitch: {voiceSettings.pitch}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={voiceSettings.pitch}
              onChange={(e) => updateSettings({ pitch: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          
          {/* Speech Volume */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Speech Volume: {Math.round(voiceSettings.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceSettings.volume}
              onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          
          {/* Voice Selection */}
          {availableVoicesRef.current.length > 0 && (
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                Voice
              </label>
              <select
                value={voiceSettings.voice}
                onChange={(e) => updateSettings({ voice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="default">Default</option>
                {availableVoicesRef.current.map((voice, index) => (
                  <option key={index} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Recognition Language */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Recognition Language
            </label>
            <select
              value={voiceSettings.language}
              onChange={(e) => updateSettings({ language: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
              <option value="it-IT">Italian</option>
              <option value="pt-BR">Portuguese</option>
            </select>
          </div>
          
          {/* Advanced Options */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={voiceSettings.continuous}
                onChange={(e) => updateSettings({ continuous: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Continuous listening
              </span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={voiceSettings.interimResults}
                onChange={(e) => updateSettings({ interimResults: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show interim results
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper hook for easy integration
export function useVoiceControls() {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const voiceControlsRef = useRef<{
    speak: (text: string) => void
    startListening: () => void
    stopListening: () => void
    stopSpeaking: () => void
  } | null>(null)

  const speak = useCallback((text: string) => {
    if (isVoiceEnabled && voiceControlsRef.current) {
      voiceControlsRef.current.speak(text)
    }
  }, [isVoiceEnabled])

  const startListening = useCallback(() => {
    if (isVoiceEnabled && voiceControlsRef.current) {
      voiceControlsRef.current.startListening()
    }
  }, [isVoiceEnabled])

  const stopListening = useCallback(() => {
    if (isVoiceEnabled && voiceControlsRef.current) {
      voiceControlsRef.current.stopListening()
    }
  }, [isVoiceEnabled])

  const stopSpeaking = useCallback(() => {
    if (isVoiceEnabled && voiceControlsRef.current) {
      voiceControlsRef.current.stopSpeaking()
    }
  }, [isVoiceEnabled])

  return {
    isVoiceEnabled,
    setIsVoiceEnabled,
    voiceControlsRef,
    speak,
    startListening,
    stopListening,
    stopSpeaking
  }
}
