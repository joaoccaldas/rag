"use client"

import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, Pause, Play } from 'lucide-react'

interface VoiceOutputProps {
  text: string
  isEnabled: boolean
  autoPlay?: boolean
  className?: string
  onStart?: () => void
  onEnd?: () => void
}

export function VoiceOutput({ 
  text, 
  isEnabled, 
  autoPlay = false, 
  className = '',
  onStart,
  onEnd
}: VoiceOutputProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    // Check if Web Speech API is supported
    setIsSupported('speechSynthesis' in window)
  }, [])

  useEffect(() => {
    if (autoPlay && isEnabled && text && isSupported) {
      // Stop any current speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      
      // Configure voice settings
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      
      // Try to use a natural-sounding voice
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Neural') || voice.name.includes('Enhanced'))
      ) || voices.find(voice => voice.lang.startsWith('en'))
      
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onstart = () => {
        setIsSpeaking(true)
        setIsPaused(false)
        onStart?.()
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        setIsPaused(false)
        onEnd?.()
      }

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error)
        setIsSpeaking(false)
        setIsPaused(false)
      }

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }
  }, [text, autoPlay, isEnabled, isSupported, onStart, onEnd])

  const speak = () => {
    if (!isSupported || !text || !isEnabled) return

    // Stop any current speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Configure voice settings
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 0.8
    
    // Try to use a natural-sounding voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Neural') || voice.name.includes('Enhanced'))
    ) || voices.find(voice => voice.lang.startsWith('en'))
    
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => {
      setIsSpeaking(true)
      setIsPaused(false)
      onStart?.()
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setIsPaused(false)
      onEnd?.()
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error)
      setIsSpeaking(false)
      setIsPaused(false)
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const pause = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    }
  }

  const resume = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    }
  }

  const stop = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
  }

  const togglePlayPause = () => {
    if (!isSpeaking) {
      speak()
    } else if (isPaused) {
      resume()
    } else {
      pause()
    }
  }

  if (!isSupported) {
    return (
      <div className={`${className} opacity-50 cursor-not-allowed`} title="Text-to-speech not supported in this browser">
        <VolumeX className="w-5 h-5" />
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <button
        onClick={togglePlayPause}
        disabled={!isEnabled || !text}
        className={`
          ${!isEnabled || !text ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isSpeaking && !isPaused ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}
          transition-colors p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700
        `}
        title={
          !isSpeaking ? 'Read aloud' : 
          isPaused ? 'Resume' : 'Pause'
        }
      >
        {!isSpeaking ? (
          <Volume2 className="w-5 h-5" />
        ) : isPaused ? (
          <Play className="w-5 h-5" />
        ) : (
          <Pause className="w-5 h-5" />
        )}
      </button>
      
      {isSpeaking && (
        <button
          onClick={stop}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Stop"
        >
          <VolumeX className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
