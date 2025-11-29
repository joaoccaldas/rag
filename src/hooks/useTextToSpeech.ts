import { useState, useRef, useCallback } from 'react'

interface UseTextToSpeechReturn {
  speak: (text: string, options?: SpeechSynthesisUtterance) => void
  stop: () => void
  pause: () => void
  resume: () => void
  isSpeaking: boolean
  isPaused: boolean
  isSupported: boolean
  voices: SpeechSynthesisVoice[]
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Check if Speech Synthesis is supported
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Load available voices
  const loadVoices = useCallback(() => {
    if (isSupported) {
      const availableVoices = speechSynthesis.getVoices()
      setVoices(availableVoices)
    }
  }, [isSupported])

  // Load voices when they become available
  if (isSupported && speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices
  }

  const speak = useCallback((text: string, options?: Partial<SpeechSynthesisUtterance>) => {
    if (!isSupported || !text.trim()) return

    // Stop any current speech
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Apply options
    if (options) {
      Object.assign(utterance, options)
    }

    // Set default properties
    utterance.rate = options?.rate || 1
    utterance.pitch = options?.pitch || 1
    utterance.volume = options?.volume || 1

    // Use a natural-sounding voice if available
    const availableVoices = speechSynthesis.getVoices()
    const preferredVoice = availableVoices.find(voice => 
      voice.name.includes('Natural') || 
      voice.name.includes('Neural') ||
      voice.name.includes('Premium')
    ) || availableVoices.find(voice => voice.default) || availableVoices[0]

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true)
      setIsPaused(false)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setIsPaused(false)
      utteranceRef.current = null
    }

    utterance.onerror = () => {
      setIsSpeaking(false)
      setIsPaused(false)
      utteranceRef.current = null
    }

    utterance.onpause = () => {
      setIsPaused(true)
    }

    utterance.onresume = () => {
      setIsPaused(false)
    }

    utteranceRef.current = utterance
    speechSynthesis.speak(utterance)
  }, [isSupported])

  const stop = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
      setIsPaused(false)
      utteranceRef.current = null
    }
  }, [isSupported])

  const pause = useCallback(() => {
    if (isSupported && isSpeaking) {
      speechSynthesis.pause()
    }
  }, [isSupported, isSpeaking])

  const resume = useCallback(() => {
    if (isSupported && isPaused) {
      speechSynthesis.resume()
    }
  }, [isSupported, isPaused])

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    voices
  }
}
