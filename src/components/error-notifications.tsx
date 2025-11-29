/**
 * Global Error Notification Display
 * Shows toast notifications for errors, warnings, and success messages
 */

import React from 'react'
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useErrorHandler } from '@/contexts/ErrorContext'
import { Button } from '@/design-system/components/button'

export function ErrorNotificationDisplay() {
  const { errors, removeError } = useErrorHandler()

  if (errors.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {errors.slice(-5).map((error) => (
        <ErrorNotification
          key={error.id}
          error={error}
          onDismiss={() => removeError(error.id)}
        />
      ))}
    </div>
  )
}

interface ErrorNotificationProps {
  error: {
    id: string
    type: 'error' | 'warning' | 'info' | 'success'
    title: string
    message: string
    autoClose?: boolean
    action?: {
      label: string
      onClick: () => void
    }
  }
  onDismiss: () => void
}

function ErrorNotification({ error, onDismiss }: ErrorNotificationProps) {
  const [isExiting, setIsExiting] = React.useState(false)

  // Auto-dismiss after delay
  React.useEffect(() => {
    if (error.autoClose !== false) {
      const timer = setTimeout(() => {
        setIsExiting(true)
        setTimeout(onDismiss, 300) // Allow exit animation
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error.autoClose, onDismiss])

  const getIcon = () => {
    switch (error.type) {
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const getColorClasses = () => {
    switch (error.type) {
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950'
    }
  }

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(onDismiss, 300)
  }

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 shadow-lg transition-all duration-300',
        'animate-in slide-in-from-right-full',
        getColorClasses(),
        isExiting && 'animate-out slide-out-to-right-full opacity-0'
      )}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 h-6 w-6 text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </Button>

      {/* Content */}
      <div className="flex gap-3 pr-6">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {error.title}
          </div>
          <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {error.message}
          </div>
          
          {/* Action button */}
          {error.action && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={error.action.onClick}
                className="text-xs"
              >
                {error.action.label}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      {error.autoClose !== false && (
        <div className="absolute bottom-0 left-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-current opacity-30 animate-[shrink_5s_linear]"
            style={{
              animation: 'shrink 5s linear forwards'
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
