/**
 * Global Error Context for Application-wide Error Management
 * Provides toast notifications, error tracking, and retry mechanisms
 */

"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, RefreshCw } from 'lucide-react'

export interface ErrorState {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  autoClose?: boolean
  duration?: number
  timestamp: Date
}

interface ErrorContextType {
  errors: ErrorState[]
  addError: (error: Omit<ErrorState, 'id' | 'timestamp'>) => string
  removeError: (id: string) => void
  clearErrors: () => void
  retryLastFailedOperation: () => void
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export function useErrorHandler() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useErrorHandler must be used within an ErrorProvider')
  }
  return context
}

// Toast notification component
function ErrorToast({ error, onRemove }: { error: ErrorState; onRemove: (id: string) => void }) {
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
    }
  }

  const getBgColor = () => {
    switch (error.type) {
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
    }
  }

  return (
    <div className={`max-w-sm w-full border rounded-lg shadow-lg p-4 ${getBgColor()}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {error.title}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {error.message}
          </p>
          {error.action && (
            <div className="mt-3">
              <button
                onClick={error.action.onClick}
                className="inline-flex items-center px-3 py-1 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {error.action.label}
              </button>
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={() => onRemove(error.id)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Toast container component
function ErrorToastContainer({ errors, onRemove }: { errors: ErrorState[]; onRemove: (id: string) => void }) {
  if (errors.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {errors.slice(-5).map((error) => (
        <ErrorToast key={error.id} error={error} onRemove={onRemove} />
      ))}
    </div>
  )
}

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<ErrorState[]>([])
  const [lastFailedOperation, setLastFailedOperation] = useState<(() => void) | null>(null)

  const generateId = useCallback(() => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const addError = useCallback((errorData: Omit<ErrorState, 'id' | 'timestamp'>) => {
    const errorWithId: ErrorState = {
      ...errorData,
      id: generateId(),
      timestamp: new Date()
    }
    
    setErrors(prev => [...prev, errorWithId])
    
    // Auto-remove after duration
    if (errorWithId.autoClose !== false) {
      const duration = errorWithId.duration || (errorWithId.type === 'success' ? 3000 : 5000)
      setTimeout(() => {
        setErrors(prev => prev.filter(error => error.id !== errorWithId.id))
      }, duration)
    }
    
    return errorWithId.id
  }, [generateId])

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const retryLastFailedOperation = useCallback(() => {
    if (lastFailedOperation) {
      lastFailedOperation()
      setLastFailedOperation(null)
    }
  }, [lastFailedOperation])

  // Utility functions for common error types
  const contextValue: ErrorContextType = {
    errors,
    addError,
    removeError,
    clearErrors,
    retryLastFailedOperation
  }

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      <ErrorToastContainer errors={errors} onRemove={removeError} />
    </ErrorContext.Provider>
  )
}

// Utility hooks for common error scenarios
export function useAPIErrorHandler() {
  const { addError } = useErrorHandler()

  return useCallback((error: Error, operation?: () => void) => {
    let title = 'API Error'
    let message = error.message

    // Parse common API errors
    if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
      title = 'Network Error'
      message = 'Unable to connect to the server. Please check your internet connection.'
    } else if (error.message.includes('timeout')) {
      title = 'Request Timeout'
      message = 'The request took too long to complete. Please try again.'
    } else if (error.message.includes('401')) {
      title = 'Authentication Error'
      message = 'Please log in again to continue.'
    } else if (error.message.includes('403')) {
      title = 'Permission Denied'
      message = 'You do not have permission to perform this action.'
    } else if (error.message.includes('404')) {
      title = 'Not Found'
      message = 'The requested resource was not found.'
    } else if (error.message.includes('500')) {
      title = 'Server Error'
      message = 'An internal server error occurred. Please try again later.'
    }

    return addError({
      type: 'error',
      title,
      message,
      action: operation ? {
        label: 'Retry',
        onClick: operation
      } : undefined
    })
  }, [addError])
}

export function useSuccessNotification() {
  const { addError } = useErrorHandler()

  return useCallback((title: string, message: string) => {
    return addError({
      type: 'success',
      title,
      message,
      autoClose: true,
      duration: 3000
    })
  }, [addError])
}

export function useInfoNotification() {
  const { addError } = useErrorHandler()

  return useCallback((title: string, message: string) => {
    return addError({
      type: 'info',
      title,
      message,
      autoClose: true,
      duration: 4000
    })
  }, [addError])
}

export function useWarningNotification() {
  const { addError } = useErrorHandler()

  return useCallback((title: string, message: string) => {
    return addError({
      type: 'warning',
      title,
      message,
      autoClose: true,
      duration: 5000
    })
  }, [addError])
}
