"use client"

import React, { memo } from 'react'
import { Bot } from 'lucide-react'

interface TypingIndicatorProps {
  className?: string
  botName?: string
}

const TypingIndicatorComponent = ({ 
  className = '', 
  botName = 'AI Assistant' 
}: TypingIndicatorProps) => {
  return (
    <div className={`flex gap-3 ${className}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center">
        <Bot className="w-4 h-4" />
      </div>

      {/* Typing Animation */}
      <div className="flex-1">
        <div className="inline-block bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
          <div className="flex items-center space-x-1">
            <span className="text-body-small text-muted-foreground mr-2">
              {botName} is typing
            </span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
        <div className="text-caption text-muted-foreground mt-1">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
        </div>
      </div>
    </div>
  )
}

TypingIndicatorComponent.displayName = 'TypingIndicator'

export const TypingIndicator = memo(TypingIndicatorComponent)
