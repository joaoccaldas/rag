"use client"

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Square } from 'lucide-react'

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition
    }
    webkitSpeechRecognition: {
      new (): SpeechRecognition
    }
  }
}

interface VoiceInputProps {
  onTranscript: (text: string) => void
  isEnabled: boolean
  className?: string
}

export function VoiceInput({ onTranscript, isEnabled, className = '' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check if Web Speech API is supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      setIsSupported(!!SpeechRecognition)

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onstart = () => {
          setIsListening(true)
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognition.onresult = (event) => {
          let finalTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            }
          }

          if (finalTranscript) {
            onTranscript(finalTranscript)
          }
        }

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onTranscript])

  const toggleListening = () => {
    if (!recognitionRef.current || !isEnabled) return

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  if (!isSupported) {
    return (
      <div className={`${className} opacity-50 cursor-not-allowed`} title="Voice input not supported in this browser">
        <MicOff className="w-5 h-5" />
      </div>
    )
  }

  return (
    <button
      onClick={toggleListening}
      disabled={!isEnabled}
      className={`
        ${className} 
        ${isListening 
          ? 'text-red-500 hover:text-red-600 animate-pulse' 
          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }
        ${!isEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-colors p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700
      `}
      title={isListening ? 'Stop voice input' : 'Start voice input'}
    >
      {isListening ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  )
}
