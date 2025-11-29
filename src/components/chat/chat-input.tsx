/**
 * Chat Input Component
 * Handles message input, validation, and submission
 */

import React, { useState, useRef, useCallback, KeyboardEvent } from 'react'
import { Send, Loader2, Mic, MicOff } from 'lucide-react'
import { cn } from '@/utils/cn'
import { validateMessage } from './types'
import { useErrorHandler } from '@/contexts/ErrorContext'
import { Button } from '@/design-system/components/button'

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  showVoiceInput?: boolean
  onVoiceToggle?: () => void
  isVoiceActive?: boolean
  className?: string
}

export function ChatInput({
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder = 'Type your message...',
  maxLength = 4000,
  showVoiceInput = false,
  onVoiceToggle,
  isVoiceActive = false,
  className
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { addError } = useErrorHandler()

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    const validation = validateMessage(message)
    
    if (!validation.isValid) {
      addError({
        type: 'error',
        title: 'Message Error',
        message: validation.error || 'Invalid message'
      })
      return
    }

    try {
      await onSendMessage(message)
      setMessage('')
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      addError({
        type: 'error',
        title: 'Send Error',
        message: error instanceof Error ? error.message : 'Failed to send message'
      })
    }
  }, [message, onSendMessage, addError])

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!isLoading && !disabled && message.trim()) {
        handleSubmit()
      }
    }
  }, [handleSubmit, isLoading, disabled, message])

  const handleChange = useCallback((value: string) => {
    if (value.length <= maxLength) {
      setMessage(value)
      setTimeout(adjustHeight, 0)
    }
  }, [maxLength, adjustHeight])

  const canSend = message.trim().length > 0 && !isLoading && !disabled

  return (
    <div className={cn('flex flex-col space-y-2', className)}>
      {/* Character count */}
      {message.length > maxLength * 0.8 && (
        <div className="text-xs text-neutral-500 dark:text-neutral-400 text-right">
          {message.length}/{maxLength}
        </div>
      )}

      <div
        className={cn(
          'flex items-end space-x-2 p-3 border rounded-lg transition-colors',
          isFocused
            ? 'border-primary-500 bg-white dark:bg-neutral-900'
            : 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Voice input button */}
        {showVoiceInput && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onVoiceToggle}
            disabled={disabled}
            className={cn(
              'shrink-0 p-2',
              isVoiceActive && 'text-red-500 bg-red-50 dark:bg-red-950'
            )}
          >
            {isVoiceActive ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
        )}

        {/* Message input */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={disabled ? 'Chat is disabled' : placeholder}
          disabled={disabled}
          className={cn(
            'flex-1 min-h-[2.5rem] max-h-[7.5rem] border-0 bg-transparent resize-none',
            'focus:outline-none focus:ring-0 p-0 text-sm',
            'text-neutral-900 dark:text-neutral-100',
            'placeholder:text-neutral-500 dark:placeholder:text-neutral-400'
          )}
          style={{ height: '2.5rem' }}
        />

        {/* Send button */}
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={!canSend}
          className="shrink-0 p-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Validation error display */}
      {message.length > 0 && (
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          {!validateMessage(message).isValid && (
            <span className="text-red-500">
              {validateMessage(message).error}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
