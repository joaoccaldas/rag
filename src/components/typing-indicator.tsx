/**
 * Typing Indicator Component
 * Professional typing indicators for enhanced chat experience
 */

import React from 'react'
import { Spinner } from '../design-system/components/spinner'
import { cn } from '../utils/cn'

interface TypingIndicatorProps {
  variant?: 'dots' | 'pulse' | 'wave'
  size?: 'sm' | 'default' | 'lg'
  text?: string
  className?: string
}

export function TypingIndicator({ 
  variant = 'dots', 
  size = 'default', 
  text = 'AI is typing',
  className 
}: TypingIndicatorProps) {
  if (variant === 'dots') {
    return (
      <div className={cn("flex items-center space-x-2 py-2", className)}>
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "bg-muted-foreground rounded-full animate-bounce",
                size === 'sm' && "w-1 h-1",
                size === 'default' && "w-2 h-2",
                size === 'lg' && "w-3 h-3"
              )}
              style={{ 
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.4s'
              }}
            />
          ))}
        </div>
        <span className={cn(
          "text-muted-foreground",
          size === 'sm' && "text-xs",
          size === 'default' && "text-sm",
          size === 'lg' && "text-base"
        )}>
          {text}...
        </span>
      </div>
    )
  }

  if (variant === 'wave') {
    return (
      <div className={cn("flex items-center space-x-2 py-2", className)}>
        <div className="flex space-x-0.5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "bg-muted-foreground animate-pulse",
                size === 'sm' && "w-0.5 h-2",
                size === 'default' && "w-1 h-3",
                size === 'lg' && "w-1.5 h-4"
              )}
              style={{ 
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
        <span className={cn(
          "text-muted-foreground",
          size === 'sm' && "text-xs",
          size === 'default' && "text-sm", 
          size === 'lg' && "text-base"
        )}>
          {text}...
        </span>
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn("flex items-center space-x-2 py-2", className)}>
        <div className={cn(
          "bg-muted-foreground rounded-full animate-pulse",
          size === 'sm' && "w-2 h-2",
          size === 'default' && "w-3 h-3",
          size === 'lg' && "w-4 h-4"
        )} />
        <span className={cn(
          "text-muted-foreground animate-pulse",
          size === 'sm' && "text-xs",
          size === 'default' && "text-sm",
          size === 'lg' && "text-base"
        )}>
          {text}...
        </span>
      </div>
    )
  }

  return null
}

interface StreamingTypingIndicatorProps {
  isStreaming: boolean
  streamText?: string
  className?: string
}

export function StreamingTypingIndicator({ 
  isStreaming, 
  streamText = 'Generating response',
  className 
}: StreamingTypingIndicatorProps) {
  if (!isStreaming) return null

  return (
    <div className={cn("flex items-center space-x-2 p-3 bg-muted/50 rounded-lg", className)}>
      <Spinner variant="dots" size="sm" />
      <span className="text-sm text-muted-foreground">{streamText}...</span>
    </div>
  )
}

export default TypingIndicator
