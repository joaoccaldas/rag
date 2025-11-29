"use client"

import React, { useState, useRef, useCallback, memo } from 'react'
import { Send, Paperclip, Mic, Square, Smile } from 'lucide-react'
import { VoiceInput } from '../voice-input'

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: string) => void
  onVoiceTranscript?: (transcript: string) => void
  isLoading?: boolean
  disabled?: boolean
  voiceEnabled?: boolean
  fileUploadEnabled?: boolean
  placeholder?: string
  maxLength?: number
  className?: string
}

const MessageInputComponent = ({
  value,
  onChange,
  onSend,
  onVoiceTranscript,
  isLoading = false,
  disabled = false,
  voiceEnabled = false,
  fileUploadEnabled = false,
  placeholder = "Type your message...",
  maxLength = 4000,
  className = ''
}: MessageInputProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 150) // Max height of ~6 lines
      textarea.style.height = `${newHeight}px`
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      onChange(newValue)
      adjustTextareaHeight()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !isLoading && !disabled) {
        onSend(value.trim())
      }
    }
  }

  const handleSend = () => {
    if (value.trim() && !isLoading && !disabled) {
      onSend(value.trim())
    }
  }

  const handleVoiceToggle = () => {
    setIsVoiceActive(!isVoiceActive)
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Handle file upload logic here
      console.log('File selected:', file.name)
      // You can implement file analysis here
    }
  }

  const insertEmoji = (emoji: string) => {
    onChange(value + emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  const commonEmojis = ['😊', '😂', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💡', '❓']

  return (
    <div className={`border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${className}`}>
      <div className="p-4">
        <div className="relative flex items-end gap-2">
          {/* File Upload */}
          {fileUploadEnabled && (
            <>
              <button
                onClick={handleFileUpload}
                className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.pptx,.ppt,.txt,.md"
              />
            </>
          )}

          {/* Emoji Picker */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 z-10">
                <div className="grid grid-cols-5 gap-1">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-heading-4"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none overflow-y-auto min-h-[40px] max-h-[150px]"
              disabled={isLoading || disabled}
              rows={1}
            />
            
            {/* Character count */}
            <div className="absolute bottom-1 right-2 text-caption text-muted-foreground">
              {value.length}/{maxLength}
            </div>
          </div>

          {/* Voice Input */}
          {voiceEnabled && (
            <div className="flex-shrink-0">
              {isVoiceActive ? (
                <button
                  onClick={handleVoiceToggle}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                  title="Stop recording"
                >
                  <Square className="w-5 h-5 fill-current" />
                </button>
              ) : (
                <button
                  onClick={handleVoiceToggle}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title="Voice input"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}
              
              {isVoiceActive && onVoiceTranscript && (
                <VoiceInput
                  onTranscript={onVoiceTranscript}
                  isEnabled={isVoiceActive}
                  className="absolute bottom-12 right-0"
                />
              )}
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!value.trim() || isLoading || disabled}
            className="flex-shrink-0 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-2 text-caption text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {voiceEnabled && (
            <span>• Click mic for voice input</span>
          )}
        </div>
      </div>
    </div>
  )
}

MessageInputComponent.displayName = 'MessageInput'

export const MessageInput = memo(MessageInputComponent)
